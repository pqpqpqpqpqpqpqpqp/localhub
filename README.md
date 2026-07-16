# 📍 LocalHub (Seoul Quiet Spot Finder)

> **"도심의 소음과 인파에 지친 당신을 위한 서울의 조용한 쉼터 시각화 및 추천 서비스"**  
> LocalHub는 서울 내 500여 개의 장소를 분석하여 사용자에게 평온한 공간을 추천하는 SPA(Single Page Application)입니다.

---

## 🚀 프로젝트 상태
- **진행도**: 95% (UI, 지도, 게시판, 챗봇 기능 구현 완료)
- **마감 기한**: 2026-07-16
- **남은 작업**: 
  - Netlify 배포 확인
  - OpenAI API 키 환경변수 설정 (선택 사항)

---

## ✨ 핵심 기능

### 🗺️ 지도 시각화 (Map Visualization)
- **Leaflet 기반**: 서울권 537개 장소 데이터 매핑
- **마커 클러스터링**: 밀집된 장소를 그룹화하여 시각적 쾌적함 제공
- **상세 팝업**: 장소별 썸네일, 주소 확인 및 리뷰 연결 기능

### 🔍 카테고리 및 필터링
- **맞춤형 검색**: 자치구별, 장소 카테고리별 필터링
- **조용함 레벨**: 사용자가 원하는 정숙도에 따른 장소 정렬

### 📝 익명 게시판 (Board)
- **간편한 소통**: 별도의 회원가입 없이 이용 가능
- **데이터 관리**: 브라우저 `localStorage`를 활용한 CRUD 구현
- **보안**: 비밀번호 설정을 통한 게시글 수정 및 삭제 제한

### 📊 조용함 지수 (Quietness Index)
- **데이터 결합**: 장소별 기본 점수와 사용자 리뷰를 결합한 `finalQuiet` 점수 산출
- **알고리즘**: `useQuietScore.js` 로직을 통한 객관적 지표 제공

### 🤖 AI 챗봇 (Local AI Assistant)
- **로컬 추천**: 내장된 데이터를 기반으로 최적의 장소 추천
- **OpenAI 연동**: API 키 설정 시 고도화된 대화 서비스 제공
- **UI/UX**: 플로팅 버튼 형태의 인터페이스로 접근성 향상

---

## 📁 주요 파일 구조

```text
src/
├── layouts/
│   └── DefaultLayout.vue      # 기본 레이아웃
├── views/
│   └── HomeView.vue           # 메인 페이지
├── components/
│   ├── ChatBot.vue            # 챗봇 컴포넌트
│   └── QuietMap.vue           # 지도 시각화 컴포넌트
├── composables/
│   ├── usePosts.js            # 게시판 비즈니스 로직
│   └── useQuietScore.js       # 조용함 지수 산출 로직
└── public/data/
    ├── quiet_places_seoul.json # 서울시 장소 원본 데이터
    └── quiet_index_lite.json  # 조용함 지수 가공 데이터
```

---

## 🛠️ 설치 및 실행

1. 의존성 설치:
   npm install

2. 개발 서버 실행:
   npm run dev

3. 빌드 및 프리뷰:
   npm run build
   npm run preview

---

## 🔑 환경변수 설정

OpenAI 연동 기능을 사용하려면 프로젝트 루트(/)에 .env 파일을 생성하세요.
(키가 없으면 챗봇은 로컬 추천 데이터 모드로만 동작합니다.)

VITE_OPENAI_API_KEY=your_api_key_here

---

## 🌐 배포 가이드

- 플랫폼: Netlify 권장
- 빌드 명령: npm run build
- 배포 디렉터리: dist/
- 참고: netlify.toml이 포함되어 있어 레포지토리 연결 시 자동 배포가 가능합니다.

---

## 📚 데이터 출처 및 라이선스

- 데이터 출처: 한국관광공사 TourAPI 4.0 (서울권, 총 537건)
- 라이선스: 공공누리 제3유형 (출처표시 + 변경금지)

---

## 💡 주의사항 및 팁

1. 데이터 로드: 로컬 테스트 시 public/data/*.json 파일이 로컬 서버 경로에서 제대로 호출되는지 확인하세요.
2. 기여 방법: 기능 추가 및 버그 수정은 PR(Pull Request) 또는 이슈 등록을 통해 환영합니다.

---
**Developed by LocalHub Team**