(function () {
  "use strict";

  // data.js defines this global before this deferred script runs. This avoids
  // ES module loading restrictions when index.html is opened as a local file.
  const sections = window.ROUTE_SECTIONS || [];
  const storageKey = "eohandal-s3-gangneung-assignments-v2";
  const themeKey = "eohandal-s3-theme";
  const defaults = [
    ["효원", "석희", "준희", "태복"], ["효원", "혜인", "준희", "태복"],
    ["효원", "세환", "혜인", "태복"], ["석희", "세환", "준희", "태복"],
    ["석희", "세환", "준희", "태복"], ["석희", "효원", "세환", "준희"],
    ["효원", "준희", "태복", "혜인"], ["효원", "준희", "태복", "치원"],
    ["효원", "석희", "세환", "준희(또는 태복)"], ["석희", "효원", "세환", "태복(또는 준희)"],
    ["석희", "효원", "세환", "혜인"], ["석희", "준희", "태복", "혜인"],
    ["석희", "준희", "태복", "혜인"], ["석희", "효원", "세환", "준희"],
    ["석희", "효원", "세환", "준희"], ["효원", "세환", "준희", "혜인"],
    ["효원", "세환", "태복", "혜인"]
  ];
  const vehicleLabels = { ok: "가능", partial: "부분 가능", partial_no: "부분 불가", no: "불가", pending: "미정" };
  const markers = { 2: ["🍽️", "아침 식사"], 3: ["🌅", "일출 07:18"], 11: ["🌇", "일몰 17:06"] };
  const $ = (id) => document.getElementById(id);
  const rows = $("section-rows");
  const search = $("section-search");
  const expanded = new Set();
  let assignments = loadAssignments();
  let editing = null;

  function loadAssignments() {
    try { return JSON.parse(localStorage.getItem(storageKey) || "{}") || {}; }
    catch { return {}; }
  }

  function esc(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;"
    })[char]);
  }

  function number(value) { return Number(value).toLocaleString("ko-KR"); }

  function assignmentFor(section) {
    const saved = assignments[section.n] || {};
    const drivers = defaults[section.n - 1] || [];
    return {
      photo: typeof saved.photo === "string" ? saved.photo : section.photo,
      drivers: Array.from({ length: 4 }, (_, i) => typeof saved.drivers?.[i] === "string" ? saved.drivers[i] : (drivers[i] || ""))
    };
  }

  function difficultyColor(score) {
    if (score <= 2) return "#39956c";
    if (score <= 4) return "#87a55a";
    if (score <= 6) return "#d4a044";
    if (score <= 8) return "#dc7943";
    return "#d64e59";
  }

  function mapLinks(point) {
    const query = encodeURIComponent(point[3] || point[1]);
    return `<div class="map-links"><a href="https://map.naver.com/p/search/${query}" target="_blank" rel="noopener noreferrer">네이버 지도 ↗</a><a href="https://map.kakao.com/link/search/${query}" target="_blank" rel="noopener noreferrer">카카오맵 ↗</a></div>`;
  }

  function renderDetails(section) {
    const points = section.points.map((point) => `
      <div class="point"><span class="point-km">${esc(point[0])} km</span><div>
        <div class="point-name">${esc(point[1])}</div>
        ${point[2] ? `<p class="point-note">${esc(point[2])}</p>` : ""}${mapLinks(point)}
      </div></div>`).join("");
    const notes = section.notes.map((note) => `<p class="warning">${esc(note)}</p>`).join("");
    const video = section.video ? `<p><a href="${esc(section.video)}" target="_blank" rel="noopener noreferrer">선자령 참고 영상 ↗</a></p>` : "";
    const vehicleNote = section.vehicleNote.replace(/^O(?=\s|$)/, "가능").replace(/^X(?=\s|$)/, "불가");

    return `<div class="detail-layout">
      <section class="detail-box"><h3>주요 포인트 · ${section.points.length}개</h3>${points}</section>
      <section class="detail-box"><h3>코스 및 운영 정보</h3>
        <p class="detail-label">코스 특징</p><p>${esc(section.feature).replace(/\n/g, "<br>")}</p>
        <p class="detail-label">차량 팔로잉</p><p>${esc(vehicleNote)}</p>${notes}${video}
      </section></div>`;
  }

  function renderSection(section) {
    const who = assignmentFor(section);
    const isOpen = expanded.has(section.n);
    const marker = markers[section.n];
    const drivers = who.drivers
      .map((name, i) => name ? `운전자 ${i + 1}: ${esc(name)}` : "")
      .filter(Boolean)
      .join(" / ") || "운전자 미정";
    const gpx = section.gpxPath
      ? `<a class="button gpx-button" href="${esc(section.gpxPath)}" download aria-label="${section.n}구간 GPX 다운로드">↓ GPX</a>`
      : `<button class="button gpx-button" type="button" disabled>미등록</button>`;
    const timeNote = section.end === "00:00" ? "<small>다음 날 도착</small>" : "";
    const sunNote = marker ? `<small>${esc(marker[1])}</small>` : "";
    const distance = `${number(section.dist)} km`;

    return `<tr class="route-row">
      <td class="section-cell" data-label="구간"><span class="section-number">${String(section.n).padStart(2, "0")}${marker ? `<span class="section-marker" title="${esc(marker[1])}">${marker[0]}</span>` : ""}</span>
        <button class="button detail-toggle" data-action="details" data-section="${section.n}" aria-expanded="${isOpen}" aria-controls="details-${section.n}">상세 ${isOpen ? "접기 ▴" : "보기 ▾"}</button></td>
      <td class="route-cell" data-label="코스"><div class="route-name">${esc(section.origin)} → ${esc(section.destination)}<small>${number(section.fromKm)}–${number(section.total)} km</small></div></td>
      <td class="gpx-cell" data-label="GPX">${gpx}</td>
      <td class="team-cell" data-label="팀 / 주자"><div class="team-name">${esc(section.team)}<small>${section.members.map((name) => `<span class="runner">${esc(name)}</span>`).join("")}</small></div></td>
      <td class="distance-cell numeric" data-label="거리">${distance}<span class="cumulative">(${number(section.total)} km)</span></td>
      <td class="ascent-cell numeric" data-label="상승">${number(section.up)} m<span class="cumulative">(${number(section.tu)} m)</span></td>
      <td class="descent-cell numeric" data-label="하강">${number(section.down)} m<span class="cumulative">(${number(section.td)} m)</span></td>
      <td class="time-cell" data-label="예정 시간">${esc(section.start)}–${esc(section.end)}${timeNote}${sunNote}</td>
      <td class="difficulty-cell" data-label="난이도"><span class="difficulty">${section.d}<span class="difficulty-track"><span style="width:${section.d * 10}%;background:${difficultyColor(section.d)}"></span></span></span></td>
      <td class="vehicle-cell" data-label="차량"><span class="badge badge-${esc(section.vehicle)}">${esc(vehicleLabels[section.vehicle] || "미정")}</span></td>
      <td class="assignment-cell" data-label="포토 / 운전자"><div class="assignment">${esc(who.photo || "미정")}<small>${drivers}</small></div>
        <button class="button edit-button" data-action="edit" data-section="${section.n}" aria-label="${section.n}구간 담당자 입력">입력</button></td>
    </tr>
    <tr class="detail-row" id="details-${section.n}" ${isOpen ? "" : "hidden"}><td colspan="11">${isOpen ? renderDetails(section) : ""}</td></tr>`;
  }

  function render() {
    if (!sections.length) {
      rows.innerHTML = '<tr><td colspan="11" class="loading">구간 데이터가 없습니다. js/data.js를 확인하세요.</td></tr>';
      return;
    }
    const query = search.value.trim().toLocaleLowerCase("ko-KR");
    const visible = sections.filter((section) => {
      const text = [section.n, section.team, section.origin, section.destination, ...section.members, ...section.points.map((point) => point[1])].join(" ").toLocaleLowerCase("ko-KR");
      return text.includes(query);
    });
    $("section-count").textContent = `${visible.length} / ${sections.length} 구간`;
    rows.innerHTML = visible.map(renderSection).join("");
  }

  function openEditor(sectionNumber) {
    const section = sections.find((item) => item.n === sectionNumber);
    if (!section) return;
    editing = sectionNumber;
    const current = assignmentFor(section);
    $("dialog-title").textContent = `${sectionNumber}구간 담당자 입력`;
    $("photo-input").value = current.photo;
    current.drivers.forEach((name, i) => { $(`driver-${i + 1}`).value = name; });
    $("assignment-dialog").showModal();
  }

  rows.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const sectionNumber = Number(button.dataset.section);
    if (button.dataset.action === "edit") { openEditor(sectionNumber); return; }
    expanded.has(sectionNumber) ? expanded.delete(sectionNumber) : expanded.add(sectionNumber);
    render();
  });

  search.addEventListener("input", render);
  $("assignment-form").addEventListener("submit", (event) => {
    event.preventDefault();
    if (editing === null) return;
    assignments[editing] = {
      photo: $("photo-input").value.trim(),
      drivers: Array.from({ length: 4 }, (_, i) => $(`driver-${i + 1}`).value.trim())
    };
    try { localStorage.setItem(storageKey, JSON.stringify(assignments)); }
    catch { $("announcements").textContent = "브라우저 저장소를 사용할 수 없어 현재 화면에만 반영했습니다."; }
    $("assignment-dialog").close();
    $("announcements").textContent = `${editing}구간 담당자 정보를 저장했습니다.`;
    editing = null;
    render();
  });
  $("dialog-cancel").addEventListener("click", () => $("assignment-dialog").close());
  $("dialog-close").addEventListener("click", () => $("assignment-dialog").close());

  function applyTheme(dark) {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    $("theme-toggle").setAttribute("aria-pressed", String(dark));
    $("theme-toggle").textContent = dark ? "◐ 라이트 모드" : "◐ 다크 모드";
  }
  try { applyTheme(localStorage.getItem(themeKey) === "dark"); }
  catch { applyTheme(false); }
  $("theme-toggle").addEventListener("click", () => {
    const dark = document.documentElement.dataset.theme !== "dark";
    applyTheme(dark);
    try { localStorage.setItem(themeKey, dark ? "dark" : "light"); } catch { /* This view still changes theme. */ }
  });

  render();
})();
