import { chromium, expect } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

const origin = 'http://127.0.0.1:5174';
await mkdir('qa-artifacts', { recursive: true });
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const errors = [];
const checks = [];
async function login(email, path) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`${origin}/login`);
  await page.getByLabel('Email', { exact: true }).fill(email);
  await page.getByLabel('Mật khẩu', { exact: true }).fill('123456');
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await expect(page).not.toHaveURL(/\/login$/, { timeout: 20000 });
  await page.goto(`${origin}${path}`);
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
  const manager = await login('manager@equitrack.vn', '/manager/race-registrations');
  checks.push('Three independent browser sessions authenticated through the actual login UI');
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
  const end = new Date(`${today}T12:00:00+07:00`); end.setDate(end.getDate() + 20);
  const endDate = end.toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
  const name = `QA đồng bộ ${Date.now()}`;
  const ownerId = await owner.evaluate(() => JSON.parse(localStorage.getItem('equitrack.apiSession')).user.apiUserId);
  const horse = await api(manager, '/manager/horses', 'POST', {
    ten: `QA horse ${Date.now()}`, giong: 'Thoroughbred', tuoi: 5, canNang: 480,
    dongDoi: 'Demo', ownerID: ownerId, gioiTinh: 'Ngựa đực', trangThaiSucKhoe: 'Đủ điều kiện',
  });
  const plan = await api(trainer, '/trainer/training-plans', 'POST', {
    horseId: horse.horseID, planName: name, notes: 'PRIVATE-QA-NOTE',
    phases: [{ phaseName: 'Nền tảng', startDate: today, endDate, intensityLevel: 'Low', sessionsPerWeek: 3, targetDistanceKm: 2, sessionDurationMinutes: 30, surface: 'Dirt' }],
  });
  await trainer.goto(`${origin}/trainer/plans/${plan.planId}`);
  await expect(trainer.getByRole('button', { name: 'Áp dụng', exact: true })).toBeDisabled();
  await expect(owner.getByText(name, { exact: true })).toHaveCount(0);
  await trainer.getByRole('button', { name: 'Gửi chủ ngựa', exact: true }).click();
  await trainer.getByRole('button', { name: 'Gửi', exact: true }).click();
  await expect(owner.getByText(name, { exact: true })).toBeVisible({ timeout: 10000 });
  checks.push('Submitted training plan appeared in the already-open owner page without navigation or reload');
  const row = owner.locator('li').filter({ has: owner.getByText(name, { exact: true }) });
  await row.getByRole('button', { name: 'Xem & duyệt', exact: true }).click();
  await expect(owner.getByText('PRIVATE-QA-NOTE')).toHaveCount(0);
  await owner.getByRole('button', { name: 'Đồng ý', exact: true }).click();
  await owner.getByRole('dialog').filter({ has: owner.getByRole('heading', { name: 'Đồng ý kế hoạch', exact: true }) }).getByRole('button', { name: 'Đồng ý', exact: true }).click();
  await expect(trainer.getByRole('button', { name: 'Áp dụng', exact: true })).toBeEnabled({ timeout: 10000 });
  checks.push('Owner approval enabled Apply on the already-open trainer page; internal notes stayed private');
  await api(trainer, `/trainer/training-plans/${plan.planId}/activate`, 'POST');
  await api(trainer, `/trainer/training-plans/${plan.planId}/sessions`, 'POST', { trainingDate: today, startTime: '16:30', trainingType: 'Trot', sessionTitle: `Buổi tập ${name}`, distanceKm: 2, durationMinutes: 30 });
  await expect(owner.getByText(`Buổi tập ${name}`, { exact: true })).toBeVisible({ timeout: 10000 });
  checks.push('A real database training session appeared in the open owner schedule without reopening the trainer detail');

  const race = (await api(trainer, '/races')).find((r) => r.ngay >= today && (!r.registrationDeadline || r.registrationDeadline >= today));
  if (!race) throw new Error('No open demo race available');
  let proposal = await api(trainer, '/approvals/races', 'POST', { horseId: horse.horseID, raceId: race.raceID, note: 'Browser QA' });
  await trainer.goto(`${origin}/trainer/race-registrations`);
  await owner.goto(`${origin}/owner/races`);
  proposal = await api(trainer, `/approvals/races/${proposal.id}/submit`, 'POST');
  const ownerRaceRow = owner.getByRole('row').filter({ hasText: proposal.raceName }).filter({ hasText: proposal.horseName });
  await expect(ownerRaceRow).toBeVisible({ timeout: 10000 });
  await ownerRaceRow.getByRole('button', { name: 'Xem & duyệt', exact: true }).click();
  await owner.getByRole('button', { name: 'Đồng ý', exact: true }).click();
  await owner.getByRole('dialog').filter({ has: owner.getByRole('heading', { name: 'Đồng ý đăng ký', exact: true }) }).getByRole('button', { name: 'Đồng ý', exact: true }).click();
  const managerRow = manager.getByRole('row').filter({ hasText: proposal.raceName }).filter({ hasText: proposal.horseName });
  await expect(managerRow).toBeVisible({ timeout: 10000 });
  checks.push('Owner race decision appeared in the already-open manager queue');
  await managerRow.getByRole('button', { name: 'Xem & duyệt', exact: true }).click();
  await manager.getByRole('button', { name: 'Duyệt', exact: true }).click();
  await manager.getByRole('dialog').filter({ has: manager.getByRole('heading', { name: 'Duyệt đăng ký', exact: true }) }).getByRole('button', { name: 'Duyệt', exact: true }).click();
  const trainerRow = trainer.getByRole('row').filter({ hasText: proposal.raceName }).filter({ hasText: proposal.horseName });
  await expect(trainerRow.getByText('Đã duyệt', { exact: true })).toBeVisible({ timeout: 10000 });
  const entries = await api(owner, '/races/registrations');
  if (!entries.some((r) => r.raceID === proposal.raceId && r.horseID === proposal.horseId)) throw new Error('Approved race missing actual database entry');
  checks.push('Manager approval appeared live for trainer and created the actual race entry visible to owner');
  await owner.goto(`${origin}/owner/schedule`);
  await expect(owner.getByRole('row').filter({ hasText: proposal.raceName }).filter({ hasText: proposal.horseName })).toBeVisible();
  await owner.screenshot({ path: 'qa-artifacts/owner-schedule.png', fullPage: true });
  await trainer.screenshot({ path: 'qa-artifacts/trainer-races.png', fullPage: true });
  if (errors.length) throw new Error(`Browser errors: ${errors.join('; ')}`);
  await writeFile('qa-artifacts/result.json', JSON.stringify({ passed: true, checks, browserErrors: errors }, null, 2));
  console.log(JSON.stringify({ passed: true, checks }, null, 2));
} catch (error) {
  const pages = browser.contexts().flatMap((c) => c.pages());
  for (let i = 0; i < pages.length; i++) {
    await pages[i].screenshot({ path: `qa-artifacts/failure-${i}.png`, fullPage: true }).catch(() => {});
    await writeFile(`qa-artifacts/failure-${i}.txt`, await pages[i].locator('body').innerText()).catch(() => {});
  }
  await writeFile('qa-artifacts/result.json', JSON.stringify({ passed: false, checks, error: String(error), browserErrors: errors }, null, 2));
  throw error;
} finally { await browser.close(); }
