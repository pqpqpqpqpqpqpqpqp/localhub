<template>
  <div class="chatbot" :class="{ open: isOpen }">
    <button class="fab" @click="toggle" :aria-expanded="isOpen" :aria-label="isOpen ? '채팅 닫기' : '채팅 열기'">
      <span v-if="!isOpen">💬</span>
      <span v-else>✕</span>
    </button>

    <transition name="fade">
      <div v-if="isOpen" class="panel" role="dialog" aria-label="무음 도우미">
        <header class="panel-header">
          <span>무음 도우미</span>
        </header>

        <div class="messages" ref="messagesRef" role="log" aria-live="polite">
          <div v-for="(m, idx) in messages" :key="idx" :class="['message', m.role]">
            <div class="bubble">{{ m.content }}</div>
          </div>

          <div v-if="loading" class="message assistant loading">
            <div class="bubble loading-bubble">…</div>
          </div>
        </div>

        <form class="composer" @submit.prevent="send">
          <input v-model="input" class="input" type="text" placeholder="메시지를 입력해 주세요." aria-label="메시지 입력"
            @keydown.enter.prevent="send" />
          <button class="send-btn" type="submit" :disabled="loading" aria-label="전송">
            전송
          </button>
        </form>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue';

// 챗봇 UI 상태 변수
const isOpen = ref(false);
const input = ref('');
const loading = ref(false);
const messagesRef = ref(null);

const messages = ref([
  {
    role: 'assistant',
    content: '안녕하세요! 서울의 조용한 쉼터를 추천하는 무음 도우미입니다. 어느 자치구나 어떤 종류(예: 카페, 도서관, 공원)의 장소를 찾으시는지 편하게 질문해 주세요.'
  }
]);

// 로컬 데이터 저장용 변수
const places = ref([]);

// 컴포넌트 마운트 시 JSON 데이터 로드 및 병합
onMounted(async () => {
  try {
    const [placesRes, indexRes] = await Promise.all([
      fetch('/data/quiet_places_seoul.json').then(r => r.ok ? r.json() : { items: [] }),
      fetch('/data/quiet_index_lite.json').then(r => r.ok ? r.json() : { items: [] })
    ]);

    const rawPlaces = placesRes.items || [];
    const rawIndices = indexRes.items || [];

    // quiet_index_lite.json의 정숙도 평점(q)을 매핑하기 위한 Map 생성
    const indexMap = new Map();
    rawIndices.forEach(item => {
      if (item.id) {
        indexMap.set(String(item.id), item);
      }
    });

    // 두 데이터 병합하여 places에 저장
    places.value = rawPlaces.map(place => {
      const matchedIndex = indexMap.get(String(place.contentid));
      return {
        ...place,
        finalQuiet: matchedIndex ? matchedIndex.q : place.baseQuiet || 3
      };
    });
  } catch (error) {
    console.error('데이터 로드 실패:', error);
  }
});

// 스크롤 하단 이동 함수
const scrollToBottom = async () => {
  await nextTick();
  if (messagesRef.value) {
    messagesRef.value.scrollTop = messagesRef.value.scrollHeight;
  }
};

// 창 토글
const toggle = () => {
  isOpen.value = !isOpen.value;
  if (isOpen.value) {
    scrollToBottom();
  }
};

const findRelevantPlaces = (query) => {
  if (!places.value.length) return [];

  const cleanQuery = query.trim().toLowerCase();
  if (!cleanQuery) return [];

  let matched = [];

  // 1. 특정 자치구 검색 대응 (예: '강남', '종로구' 등)
  const guList = ["강남구", "강동구", "강북구", "강서구", "관악구", "광진구", "구로구", "금천구", "노원구", "도봉구", "동대문구", "동작구", "마포구", "서대문구", "서초구", "성동구", "성북구", "송파구", "양천구", "영등포구", "용산구", "은평구", "종로구", "중구", "중랑구"];
  let targetedGu = null;
  for (const gu of guList) {
    if (cleanQuery.includes(gu) || cleanQuery.includes(gu.replace('구', ''))) {
      targetedGu = gu;
      break;
    }
  }

  // 2. 카테고리 유연 매핑 키워드 대응
  let targetedCat = null;
  const catMap = {
    "도서관": "도서관",
    "책": "도서관",
    "북": "도서관",
    "숲": "둘레길/숲길",
    "길": "둘레길/숲길",
    "산": "둘레길/숲길",
    "둘레길": "둘레길/숲길",
    "사찰": "사찰",
    "절": "사찰",
    "미술관": "미술관/갤러리",
    "갤러리": "미술관/갤러리",
    "전시": "미술관/갤러리",
    "박물관": "박물관",
    "공원": "공원/자연",
    "호수": "호수/근린공원"
  };
  for (const [key, cat] of Object.entries(catMap)) {
    if (cleanQuery.includes(key)) {
      targetedCat = cat;
      break;
    }
  }

  // 3. 자치구 및 카테고리에 기반한 1차 검색 실행
  matched = places.value.filter(place => {
    const isGuMatch = targetedGu ? place.gu === targetedGu : true;
    const isCatMatch = targetedCat ? place.catName === targetedCat : true;
    return isGuMatch && isCatMatch;
  });

  // 4. 자치구/카테고리 매칭 결과가 비어있거나 구체적 대상이 안 잡힌 경우, 텍스트 키워드 부분 매칭 시도
  if (matched.length === 0 || (!targetedGu && !targetedCat)) {
    const stopWords = ["추천", "추천해", "추천해줘", "조용한", "조용", "시원한", "시원", "어디", "공간", "장소", "카페"];
    const keywords = cleanQuery.split(/\s+/).filter(w => w.length > 1 && !stopWords.includes(w));

    if (keywords.length > 0) {
      matched = places.value.filter(place => {
        const searchText = [
          place.title,
          place.addr1,
          place.catName,
          place.gu
        ].filter(Boolean).join(' ').toLowerCase();

        return keywords.some(kw => searchText.includes(kw));
      });
    }
  }

  // [개선] 매칭 결과가 없을 경우, 억지 장소 매칭을 방지하기 위해 빈 배열([])을 그대로 반환합니다.
  return matched
    .sort((a, b) => (b.finalQuiet || 0) - (a.finalQuiet || 0))
    .slice(0, 10);
};

// [수정] OpenAI API 키가 없을 때 동작할 로컬 단순 추천 로직
const getLocalFallbackReply = (query, matched) => {
  if (matched.length === 0) {
    return `죄송하지만 말씀하신 '${query}' 키워드로는 관련 장소를 찾지 못했거나 질문을 이해하기 어렵습니다.\n\n원하시는 자치구(예: 마포구, 종로구 등)나 장소 유형(예: 도서관, 공원, 사찰 등)을 구체적으로 포함하여 다시 질문해 주시면 감사하겠습니다.`;
  }

  let reply = `[알림] 현재 OpenAI API 키가 설정되지 않아 데이터베이스 내 매칭 결과를 출력합니다.\n\n요청하신 키워드 관련 추천 장소 리스트입니다:\n\n`;
  matched.forEach((p, idx) => {
    reply += `${idx + 1}. **${p.title}**\n`;
    reply += `📍 주소: ${p.addr1 || '주소 정보 없음'} (${p.gu || ''})\n`;
    reply += `🤫 조용함 지수: ${p.finalQuiet || '정보 없음'}\n\n`;
  });
  return reply;
};

// [수정] 메시지 전송 로직
const send = async () => {
  const userText = input.value.trim();
  if (!userText || loading.value) return;

  // 1. 사용자 메시지 추가
  messages.value.push({ role: 'user', content: userText });
  input.value = '';
  loading.value = true;
  scrollToBottom();

  // 2. 키워드 및 카테고리 기반 로컬 데이터 필터링
  const matchedPlaces = findRelevantPlaces(userText);
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

  // API 키가 존재하지 않으면 로컬 추천 폴백 실행
  if (!apiKey) {
    setTimeout(() => {
      const fallbackReply = getLocalFallbackReply(userText, matchedPlaces);
      messages.value.push({ role: 'assistant', content: fallbackReply });
      loading.value = false;
      scrollToBottom();
    }, 800);
    return;
  }

  // 3. OpenAI API 호출
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `당신은 서울의 조용한 장소들을 안내하는 AI 비서 '무음 도우미'입니다.

[중요 답변 및 자체 지식 활용 원칙]
1. 로컬 데이터와 자체 지식의 유연한 결합 (★핵심):
   - 제공된 '서울 조용한 장소 데이터'에 사용자가 언급한 특정 키워드(예: 롯데타워, 코엑스, 동대문 등 유명 랜드마크나 특정 건물)가 직접 매칭되지 않아 데이터 목록이 비어 있거나 부족할 수 있습니다.
   - 이 경우 답변을 그냥 거부하지 마십시오. **당신이 이미 가진 서울 장소에 대한 자체 지식(상식)**을 동원하여, 해당 랜드마크 인근에 위치한 조용한 장소(예: 롯데타워 인근의 '석촌호수', 코엑스 내부의 '별마당도서관' 등)나 그 자치구 내의 대표적인 한적한 대안 장소를 찾아 친절하게 추천해 주십시오.
   - 로컬 데이터셋에 존재하는 장소를 우선적으로 매칭하되, 필요한 경우 자체 지식을 활용해 유연하게 답변을 보완하는 것이 허용됩니다.

2. 단순 인사 및 가벼운 잡담 처리 (장소 추천이 없을 때만):
   - "안녕", "심심해" 같이 장소를 찾지 않는 일상적인 가벼운 잡담 대화에는 다정하게 대답해 주시되, 답변 맨 끝에만 장소 추천으로 복귀를 유도하는 멘트("서울의 조용하고 편안한 쉼터를 찾고 계신가요? 원하는 자치구나 장소 유형이 있다면 언제든 말씀해 주세요!")를 붙여 주세요.

3. 거부 및 재질문 대상 (엄격히 제한):
   - 오직 사용자가 완전한 무의미한 자음/모음 나열(예: "ㄴㅇㄹㄴㅇㄹ", "ㄱㄷㄱㄷ"), 낙서성 도배글, 혹은 이 서비스와 전혀 무관하고 답변하기 곤란한 기술적 요청(예: 코딩, 수학 문제 풀이 등)을 하는 경우에만 장소 추천을 포기하고 정중히 다시 질문해 달라고 안내해 주세요.
   - 예시: "죄송하지만 질문을 이해하기 어렵습니다. 서울 내 조용한 장소(도서관, 사찰, 공원 등)나 찾으시는 자치구(예: 마포구, 종로구 등)를 포함하여 다시 질문해 주시겠어요?"

4. 덜 조용한 곳이나 비교적 야외 활동적인 공간을 원할 때:
   - 제공된 데이터 중 조용함 지수가 비교적 낮은 곳(예: 조용함 지수 3인 한강공원이나 야외 공원 등)을 매칭하여 센스 있게 추천해 주십시오.

5. 장소 추천 시 공통 포맷:
   - 추천 장소는 최대 3개까지만 제한하여 알려주세요.
   - 장소명, 주소, 카테고리, 조용함 지수(finalQuiet, 5점 만점)를 줄바꿈을 활용해 일목요연하게 표시하되, 이미지 마크다운(![텍스트](url))은 절대로 포함하지 마십시오.`
          },
          {
            role: 'user',
            content: `[참고 가능한 서울 조용한 장소 데이터]
${JSON.stringify(matchedPlaces, null, 2)}

[사용자의 질문]
${userText}`
          }
        ],
        temperature: 0.3 // 답변의 일관성을 높이기 위해 수치를 조금 더 내림
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API Error: ${response.status}`);
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || '죄송합니다. 답변을 생성하는 중에 문제가 발생했습니다.';

    messages.value.push({ role: 'assistant', content: reply });
  } catch (error) {
    console.error('API 호출 중 문제 발생:', error);
    messages.value.push({
      role: 'assistant',
      content: '죄송합니다. 서버 통신 중 오류가 발생하여 현재 답변을 드리기 어렵습니다. 잠시 후 다시 시도해 주세요.'
    });
  } finally {
    loading.value = false;
    scrollToBottom();
  }
};
</script>

<style scoped>
/* 이전과 동일한 스타일 유지 */
.chatbot {
  position: fixed;
  right: 20px;
  bottom: 20px;
  z-index: 1000;
  box-sizing: border-box;
  font-family: inherit;
}

.fab {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--color-primary);
  color: #fff;
  border: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  cursor: pointer;
  box-shadow: 0 6px 18px rgba(79,70,229,0.12);
  transition: transform 0.12s ease;
}

.fab:active {
  transform: scale(0.96);
}

.panel {
  position: absolute;
  right: 0;
  bottom: 74px;
  background: var(--color-surface);
  border-radius: 12px;
  width: min(360px, 92vw);
  max-height: min(600px, 80vh);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0,0,0,0.12);
  border: 1px solid rgba(15,23,42,0.06);
  backdrop-filter: blur(6px);
}

.panel-header {
  background: var(--color-primary);
  color: var(--color-surface);
  padding: 12px 16px;
  font-weight: 600;
  text-align: center;
  font-size: 16px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.messages {
  padding: 12px;
  flex: 1 1 auto;
  overflow-y: auto;
  background: linear-gradient(180deg, #fbffff, #f7fdfd);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.message {
  display: flex;
  width: 100%;
}

.message.assistant {
  justify-content: flex-start;
}

.message.user {
  justify-content: flex-end;
}

.bubble {
  max-width: 78%;
  padding: 10px 12px;
  border-radius: 12px;
  line-height: 1.4;
  word-break: break-word;
  white-space: pre-line;
  box-shadow: 0 2px 8px rgba(160, 219, 242, 0.04);
}

.message.assistant .bubble {
  background: #E9EBEF;
  color: #033b3b;
  border-bottom-left-radius: 6px;
}

.message.user .bubble {
  background: #4F46E5;
  color: #fff;
  border-bottom-right-radius: 6px;
}

.loading-bubble {
  opacity: 0.9;
  font-weight: 600;
  letter-spacing: 2px;
}

.composer {
  display: flex;
  gap: 8px;
  padding: 10px;
  border-top: 1px solid rgba(160, 219, 242, 0.06);
  background: #fff;
}

.input {
  flex: 1 1 auto;
  padding: 8px 10px;
  border: 1px solid #e2efef;
  border-radius: 8px;
  outline: none;
}

.input:focus {
  box-shadow: 0 0 0 3px rgba(160, 219, 242, 0.06);
  border-color: #4F46E5;
}

.send-btn {
  background: #4F46E5;
  color: #fff;
  border: none;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
}

.send-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(6px) scale(0.995);
}

@media (max-width: 480px) {
  .fab {
    width: 52px;
    height: 52px;
    font-size: 20px;
  }

  .panel {
    right: 12px;
    bottom: 70px;
    width: calc(100vw - 24px);
    max-height: 80vh;
    border-radius: 10px;
  }
}
</style>