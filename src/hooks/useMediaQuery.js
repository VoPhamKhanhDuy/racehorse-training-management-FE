import { useEffect, useState } from "react";

// true khi media query khớp (vd "(max-width: 899px)"), tự cập nhật khi đổi cỡ cửa sổ
export default function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);

  useEffect(() => {
    const media = window.matchMedia(query);
    const update = () => setMatches(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [query]);

  return matches;
}
