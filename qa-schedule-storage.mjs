import { chromium, expect } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

const base = 'http://127.0.0.1:5174';
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const pages = [], checks = [], errors = [];
await mkdir('qa-artifacts', { recursive: true });

async function login(email, path) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await context.addInitScript(() => {
    const original = Storage.prototype.setItem;
    window.blockedTrainingWrites = [];
    Storage.prototype.setItem = function(key, value) {
      if (/^(trainingPlans|trainingSchedules|trainingSessions|planGroomAssignments|lastGroomUserId|planApprovals|planApprovalNotices)$/.test(key)) {
        window.blockedTrainingWrites.push(key);
        throw new Error(`Forbidden local training write: ${key}`);
      }
      return original.call(this, key, value);
    };
  });
  const page = await context.newPage(); pages.push(page);
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(`${base}/login`);
  await page.getByLabel('Email', { exact: true }).fill(email);
  await page.getByLabel('Mật khẩu', { exact: true }).fill('123456');
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await expect(page).not.toHaveURL(/\/login$/, { timeout: 20000 });
  await page.goto(`${base}${path}`);
  return page;
}
async function api(page, path, method = 'GET', body) {
  return page.evaluate(async ({ path, method, body }) => {
    const token = JSON.parse(localStorage.getItem('equitrack.apiSession')).token;
    const response = await fetch(`/api${path}`, { method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
    const text = await response.text();
    if (!response.ok) throw new Error(`${response.status}: ${text}`);
    return text ? JSON.parse(text) : null;
  }, { path, method, body });
}
try {
  const trainer = await login('trainer@equitrack.vn', '/trainer/plans');
  const owner = await login('owner@equitrack.vn', '/owner/schedule');
  const manager = await login('manager@equitrack.vn', '/manager/horses');
  const groom = await login('groom@equitrack.vn', '/groom/training');
  const ownerId = await owner.evaluate(() => JSON.parse(localStorage.getItem('equitrack.apiSession')).user.apiUserId);
  const horseName = `Schedule storage QA ${Date.now()}`;
  const horse = await api(manager, '/manager/horses', 'POST', { ten: horseName, giong: 'Thoroughbred', tuoi: 5, canNang: 480, dongDoi: 'Demo', ownerID: ownerId, gioiTinh: 'Ngựa đực', trangThaiSucKhoe: 'Đủ điều kiện' });
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
  const end = new Date(`${today}T12:00:00+07:00`); end.setDate(end.getDate() + 27);
  const plan = await api(trainer, '/trainer/training-plans', 'POST', { horseId: horse.horseID, planName: horseName,
    phases: [{ phaseName: 'Nền tảng', startDate: today, endDate: end.toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }), intensityLevel: 'Low', sessionsPerWeek: 3, targetDistanceKm: 2, sessionDurationMinutes: 30, surface: 'Dirt' }] });
  const sent = await api(trainer, `/approvals/plans/${plan.planId}/send`, 'POST');
  await api(owner, `/approvals/plans/${plan.planId}/decision`, 'POST', { status: 'Approved', version: sent.version });
  const staff = await api(trainer, '/trainer/training-sessions/assignable-staff');
  const chosenGroom = staff.find((s) => s.roleId === 'groom');
  await trainer.goto(`${base}/trainer/plans/${plan.planId}`);
  await trainer.getByRole('button', { name: 'Áp dụng', exact: true }).click();
  await trainer.getByLabel('Nhân viên chăm sóc thực hiện', { exact: true }).selectOption(String(chosenGroom.userId));
  const activatedResponse = trainer.waitForResponse((r) => r.url().endsWith(`/training-plans/${plan.planId}/activate`) && r.request().method() === 'POST');
  await trainer.getByRole('dialog').getByRole('button', { name: 'Áp dụng', exact: true }).click();
  expect((await (await activatedResponse).json()).defaultAssignedToUserId).toBe(chosenGroom.userId);
  checks.push('Applying through the UI sends the selected groom to the backend');

  const freshTrainer = await login('trainer@equitrack.vn', `/trainer/plans/${plan.planId}/weekly-schedule`);
  await expect(freshTrainer.getByLabel('Phân công luôn cho', { exact: true })).toHaveValue(String(chosenGroom.userId));
  checks.push('A completely fresh browser context loads the groom from SQL Server');
  const createdResponse = freshTrainer.waitForResponse((r) => r.url().endsWith(`/training-plans/${plan.planId}/weekly-schedule`) && r.request().method() === 'POST');
  await freshTrainer.getByRole('button', { name: 'Tạo lịch tuần', exact: true }).click();
  const result = await (await createdResponse).json();
  expect(result.createdCount).toBeGreaterThan(0);
  expect(result.sessions.every((s) => s.assignedToUserId === chosenGroom.userId)).toBe(true);
  await expect(groom.getByText(horseName, { exact: true }).first()).toBeVisible({ timeout: 10000 });
  await expect(owner.getByRole('row').filter({ hasText: horseName }).first()).toBeVisible({ timeout: 10000 });
  checks.push('Weekly schedule creation persists sessions and updates the already-open groom and owner pages');
  const realSessions = await api(freshTrainer, `/trainer/training-sessions?from=${today}&to=${result.weekEndDate}&planId=${plan.planId}`);
  expect(realSessions.map((s) => s.sessionId).sort()).toEqual(result.sessions.map((s) => s.sessionId).sort());
  const adapters = await freshTrainer.evaluate(async () => {
    const service = await import('/src/services/trainerService.js');
    return { schedules: await service.getSchedules(), plans: await service.getTrainingPlans(), results: await service.getTrainingSessions() };
  });
  for (const session of result.sessions) expect(adapters.schedules.some((s) => s.ScheduleID === session.sessionId && s.GroomID === chosenGroom.userId)).toBe(true);
  checks.push('Legacy schedule/profile adapters return the same database schedule IDs');
  await freshTrainer.reload();
  await expect(freshTrainer.getByLabel('Phân công luôn cho', { exact: true })).toHaveValue(String(chosenGroom.userId));
  for (const page of pages) {
    const writes = await page.evaluate(() => window.blockedTrainingWrites ?? []);
    expect(writes).toEqual([]);
    const keys = await page.evaluate(() => Object.keys(localStorage).filter((key) => /^(trainingPlans|trainingSchedules|trainingSessions|planGroomAssignments|lastGroomUserId)$/.test(key)));
    expect(keys).toEqual([]);
  }
  expect(errors).toEqual([]);
  checks.push('No training localStorage keys exist or are written; reload preserves server assignment');
  await freshTrainer.screenshot({ path: 'qa-artifacts/schedule-server-storage.png', fullPage: true });
  await groom.screenshot({ path: 'qa-artifacts/groom-live-schedule.png', fullPage: true });
  await writeFile('qa-artifacts/schedule-storage-result.json', JSON.stringify({ passed: true, checks, planId: plan.planId, sessionIds: result.sessions.map((s) => s.sessionId), browserErrors: errors }, null, 2));
  console.log(JSON.stringify({ passed: true, checks }, null, 2));
} catch (error) {
  for (let i = 0; i < pages.length; i++) {
    await writeFile(`qa-artifacts/storage-failure-${i}.txt`, await pages[i].locator('body').innerText()).catch(() => {});
    await pages[i].screenshot({ path: `qa-artifacts/storage-failure-${i}.png`, fullPage: true }).catch(() => {});
  }
  await writeFile('qa-artifacts/schedule-storage-result.json', JSON.stringify({ passed: false, checks, error: String(error), browserErrors: errors }, null, 2));
  throw error;
} finally { await browser.close(); }
