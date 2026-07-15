# 📍 LocalHub (Seoul Quiet Spot Finder)

> **"도심의 소음과 인파에 지친 당신을 위한, 서울의 가장 조용한 쉼터 찾기 서비스"**  
> LocalHub는 한국관광공사 데이터를 기반으로 서울 시내의 평온한 공간을 시각화하고, 사용자간의 실시간 리뷰를 공유하는 익명 기반 웹 서비스입니다.

---

## 🚀 프로젝트 개요

- **서비스명**: LocalHub (서울 권역)
- **배포 주소**: [Netlify URL을 입력하세요]
- **개발 기간**: 2026.07.10 ~ 2026.07.16 (15:00 마감)
- **핵심 목표**: 인기순 정렬에서 벗어나 '조용함'과 '여유'를 기준으로 한 장소 정보 제공 및 즉각적인 서비스 이용 환경 구축

---

## ✨ 핵심 기능 (Must-Have)

### 🗺️ 지도 시각화 및 장소 탐색 (Leaflet.js)
- **서울 지역 537개 안식처 표시**: 사찰, 미술관, 박물관, 공원, 도서관 등 조용함이 보장된 장소 데이터 시각화
  - 사찰(66), 미술관/갤러리(125), 박물관(104), 공원(98), 도서관(62), 호수공원(43), 숲길(39)
- **카테고리 필터**: 원하는 유형의 장소만 골라볼 수 있는 필터링 기능
- **상세 정보**: 핀 클릭 시 해당 장소의 썸네일(firstimage2), 주소 확인 및 관련 리뷰 연결

### 💬 AI 쉼터 추천 챗봇 (OpenAI API)
- **실시간 대화**: OpenAI API를 연동하여 사용자의 현재 기분이나 상황에 맞는 조용한 공간 추천
- **인터페이스**: 모바일 대응 UI 및 어디서든 접근 가능한 플로팅 버튼 형태의 채팅창 제공

### 📝 익명 '조용함 리뷰' 커뮤니티 (CRUD)
- **익명성 보장**: 회원가입 없이 제목, 내용, 수정용 비밀번호만으로 즉시 게시글 작성
- **로컬 데이터 관리**: `localStorage`를 활용하여 별도의 백엔드 없이 데이터 유지
- **조용함 지수**: 사용자의 리뷰 점수를 바탕으로 장소별 '조용함 수치'를 산출하여 지도에 반영

---

## 🛠 기술 스택 (Tech Stack)

- **Framework**: `Vue.js 3 (Vite)` - 정적 SPA 구성
- **Map Library**: `Leaflet.js`
- **AI Integration**: `OpenAI API` (VITE_ 접두사를 통한 환경 변수 관리)
- **Storage**: `Browser LocalStorage`
- **Deployment**: `Netlify` (Continuous Deployment)

---

## 📊 데이터 출처 및 라이선스

- **데이터셋**: 한국관광공사 TourAPI 4.0
- **라이선스**: 공공누리 제3유형 (출처표시 + 변경금지)
- **권역**: 서울 (SEL)

## 📂 데이터 정보
- **파일명**: seoul_spots.json
- **출처**: 한국관광공사 TourAPI 4.0 (공공누리 제3유형)
- **내용**: 사찰, 미술관, 박물관, 공원 등 '조용함' 테마 장소 537건

---

## 📂 프로젝트 산출물 (Deliverables)

1. **기능명세서**: 데이터 출처 및 라이선스 목록 포함
2. **WBS**: 개발 공정 및 일정 관리표
3. **발표 PPT**: 프로젝트 기획 및 최종 결과 요약
4. **README.md**: 본 문서
5. **최종 소스코드**: GitHub 저장소 및 빌드 파일

---

## ⚙️ 시작하기 (Quick Start)

### 1. 환경 변수 설정
프로젝트 루트 디렉토리에 `.env` 파일을 생성하고 아래 내용을 입력합니다.
```env
VITE_OPENAI_API_KEY=your_openai_api_key_here

## 챗봇 연동 (OpenAI)

1. 루트에서 `.env.example`을 복사하여 `.env`로 이름을 바꾸고 키를 입력합니다:

```env
VITE_OPENAI_KEY=your_openai_api_key_here
```

2. 보안 경고: `VITE_` 접두사가 붙은 환경변수는 클라이언트 번들에 포함됩니다. 실제 서비스에서는 백엔드 프록시 또는 서버 측에서 키를 보관하고 호출하도록 구성하세요.

3. 사용법: 원하는 뷰에 `ChatBot` 컴포넌트를 추가하면 됩니다. 예:

```vue
<template>
  <ChatBot />
</template>

<script setup>
import ChatBot from '@/components/ChatBot.vue';
</script>
```

4. `src/composables/useChatbot.js`는 `import.meta.env.VITE_OPENAI_KEY`에서 키를 읽어 OpenAI Chat Completions API를 호출하며, `context` 옵션으로 시스템 메시지(컨텍스트)를 주입할 수 있습니다.
