# 어한달 시즌 3 강릉 코스 사이트

GitHub Pages에 바로 게시할 수 있는 정적 사이트입니다. HTML, CSS, JavaScript와 GPX 파일을 별도 폴더에 둡니다.

- `index.html` — 페이지 구조
- `css/styles.css` — 데스크톱 및 모바일 디자인
- `js/app.js` — 구간 표시, 검색, 상세 보기, 담당자 입력, 다크 모드
- `js/data.js` — 구간별 운영 데이터
- `gpx/full-course.gpx` — 전체 코스
- `gpx/sections/` — 구간별 GPX 17개

## GitHub Pages 게시

1. 이 폴더 안의 모든 파일을 GitHub 저장소 루트에 올립니다.
2. 저장소의 **Settings → Pages**에서 **Deploy from a branch**를 선택합니다.
3. 게시할 브랜치와 `/ (root)`를 선택해 저장합니다.

일반 스크립트를 사용해 `index.html`을 파일로 직접 열어도 구간 행이 표시됩니다. 담당자 입력과 테마 선택은 현재 브라우저에 저장됩니다.
