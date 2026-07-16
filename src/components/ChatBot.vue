<template>
  <div class="chatbot" :class="{ open: isOpen }">
    <button
      class="fab"
      @click="toggle"
      :aria-expanded="isOpen"
      :aria-label="isOpen ? '채팅 닫기' : '채팅 열기'"
    >
      <span v-if="!isOpen">💬</span>
      <span v-else>✕</span>
    </button>

    <transition name="fade">
      <div v-if="isOpen" class="panel" role="dialog" aria-label="무음 도우미">
        <header class="panel-header">
          <span>무음 도우미</span>
        </header>

        <div class="messages" ref="messagesRef" role="log" aria-live="polite">
          <div
            v-for="(m, idx) in messages"
            :key="idx"
            :class="['message', m.role]"
          >
            <div class="bubble">{{ m.content }}</div>
          </div>

          <div v-if="loading" class="message assistant loading">
            <div class="bubble loading-bubble">…</div>
          </div>
        </div>

        <form class="composer" @submit.prevent="send">
          <input
            v-model="input"
            class="input"
            type="text"
            placeholder="메시지를 입력해 주세요."
            aria-label="메시지 입력"
            @keydown.enter.prevent="send"
          />
          <button class="send-btn" type="submit" :disabled="loading" aria-label="전송">
            전송
          </button>
        </form>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted, onBeforeUnmount } from 'vue';

const isOpen = ref(false);
const CHAT_HISTORY_KEY = 'chatbot-history';

// 챗봇 시작 시 보여줄 첫 인사말
const messages = ref([
  {
    role: 'assistant',
    content: '안녕하세요! 당신의 기분에 맞는 서울의 조용한 곳을 추천해 드릴게요. 어떤 장소를 추천받고 싶으신가요?',
  },
]);

const input = ref('');
const loading = ref(false);
const messagesRef = ref(null);
const recentRecommendations = ref([]);

function toggle() {
  isOpen.value = !isOpen.value;
  if (isOpen.value) nextTick(() => scrollToBottom());
}

async function scrollToBottom() {
  await nextTick();
  const el = messagesRef.value;
  if (el) el.scrollTop = el.scrollHeight;
}

// 메시지 추가 및 로컬스토리지 임시 백업 (단순 대화 유지용)
function addMessage(role, content) {
  messages.value.push({ role, content });
  localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(messages.value));
  scrollToBottom();
}

async function send() {
  const text = (input.value || '').trim();
  if (!text || loading.value) return;

  addMessage('user', text);
  input.value = '';
  loading.value = true;

  try {
    const reply = await callOpenAI(text, messages.value.slice(-6));
    addMessage('assistant', reply);
  } catch {
    addMessage('assistant', '죄송해요. 응답을 가져오는 데 실패했어요.');
  } finally {
    loading.value = false;
  }
}

function detectMood(text) {
  const t = text.toLowerCase();

  if (/(피곤|지침|힘들|우울|슬퍼|스트레스|불안|예민|짜증|긴장|지쳐|피로|퇴근)/.test(t)) {
    return { label: '차분하고 조용한', tone: '부드럽고 안정감 있는', vibe: 'recharge' };
  }
  if (/(혼자|휴식|쉼|조용|집중|공부|독서|명상|힐링|정리|생각|마음)/.test(t)) {
    return { label: '조용하고 편안한', tone: '잔잔하고 편안한', vibe: 'focus' };
  }
  if (/(감성|데이트|산책|사진|분위기|연인|사랑|여행|감상)/.test(t)) {
    return { label: '감성적인', tone: '감성적이고 아늑한', vibe: 'romantic' };
  }

  return { label: '편안한', tone: '편안하고 산뜻한', vibe: 'comfort' };
}

function detectIntent(text) {
  const t = text.toLowerCase();
  const intent = {
    wantsDifferent: /(다른|다른 곳|다른 장소|다른 추천|다른 거|다시|다음)/.test(t),
    wantsNearby: /(근처|주변|가까운|가깝게|우리 동네|내 근처)/.test(t),
    wantsMoreQuiet: /(더 조용|조용한 곳|조용하게|조용히|한적한|한산)/.test(t),
    wantsRelax: /(휴식|힐링|쉼|명상|감정|정리|편안|relax)/.test(t),
    category: null,
  };

  if (/(도서관|책|독서|공부|학습|스터디)/.test(t)) {
    intent.category = '도서관';
  } else if (/(공원|산책|자연|한강|나무|풀|러닝)/.test(t)) {
    intent.category = '공원';
  } else if (/(카페|커피|음료|디저트|차)/.test(t)) {
    intent.category = '카페';
  } else if (/(박물관|미술|전시|문화|예술|전시회|갤러리)/.test(t)) {
    intent.category = '문화';
  } else if (/(휴식|힐링|쉼|명상|감정|정리|마음|재충전)/.test(t)) {
    intent.category = '휴식';
  }

  return intent;
}

function getReplyStyle(mood, intent) {
  if (mood.vibe === 'recharge') return '피로를 풀 수 있는';
  if (mood.vibe === 'focus') return '집중에 도움이 되는';
  if (mood.vibe === 'romantic') return '분위기 있게 즐길 수 있는';
  if (intent.wantsMoreQuiet) return '더 한적한';
  if (intent.category) return `${intent.category} 느낌의`;
  return '편안한';
}

function getReasonText(item, mood, intent) {
  if (mood.vibe === 'recharge') {
    return '피곤한 마음을 달래 줄 수 있는 조용한 분위기예요.';
  }
  if (mood.vibe === 'focus') {
    return '집중하기 좋고 차분한 분위기라 독서나 공부에 잘 어울려요.';
  }
  if (mood.vibe === 'romantic') {
    return '감성적인 풍경과 잔잔한 분위기가 잘 어우러져요.';
  }
  if (intent.category === '도서관') {
    return '책과 조용한 분위기가 잘 어우러지는 곳이에요.';
  }
  if (intent.category === '공원') {
    return '자연을 느끼며 산책하기 좋은 공간이에요.';
  }
  if (intent.category === '카페') {
    return '커피와 함께 여유를 즐기기 좋은 곳이에요.';
  }
  if (intent.category === '문화') {
    return '아늑한 분위기 속에서 감상을 즐기기 좋아요.';
  }
  if (intent.category === '휴식') {
    return '잠깐의 쉼과 회복을 위한 공간이에요.';
  }
  return '한적하고 편안하게 머무르기 좋은 곳이에요.';
}

function getExcludedNames() {
  return new Set(recentRecommendations.value.map((item) => item.name));
}

async function buildLocalReply(userText) {
  try {
    const idxResp = await fetch('/data/quiet_index_lite.json');
    const idxData = idxResp.ok ? await idxResp.json() : null;

    const items = Array.isArray(idxData?.items) ? idxData.items : [];
    if (!items.length) {
      return '현재 추천 데이터를 불러올 수 없습니다.';
    }

    const mood = detectMood(userText);
    const intent = detectIntent(userText);
    const excludedNames = getExcludedNames();

    let candidates = items
      .slice()
      .filter((item) => !excludedNames.has(item.name))
      .sort((a, b) => (b.q ?? 0) - (a.q ?? 0));

    if (intent.category) {
      candidates = candidates.filter((item) => {
        const cat = (item.cat || '').toLowerCase();
        const name = (item.name || '').toLowerCase();
        return cat.includes(intent.category.toLowerCase()) || name.includes(intent.category.toLowerCase());
      });
    }

    if (intent.wantsDifferent && candidates.length < 3) {
      candidates = items
        .slice()
        .filter((item) => !excludedNames.has(item.name))
        .sort((a, b) => (b.q ?? 0) - (a.q ?? 0));
    }

    if (intent.wantsMoreQuiet) {
      candidates = candidates.sort((a, b) => (b.q ?? 0) - (a.q ?? 0));
    }

    const picked = candidates.slice(0, 3);
    if (!picked.length) {
      const fallback = items.slice().sort((a, b) => (b.q ?? 0) - (a.q ?? 0)).slice(0, 3);
      recentRecommendations.value = fallback;
      const names = fallback.map((it) => `• **${it.name}** (${it.gu}·${it.cat})`).join('\n');
      return `이런 곳들은 어떨까요?\n\n${names}`;
    }

    recentRecommendations.value = picked;

    const descriptions = picked.map((it) => {
      const cat = it.cat || '장소';
      const gu = it.gu || '서울';
      const quietLevel = it.q ?? 0;
      const reason = getReasonText(it, mood, intent);
      return `📍 **${it.name}**\n   [${gu} / ${cat}] ⭐조용함: ${quietLevel}/10\n   ${reason}`;
    });

    const style = getReplyStyle(mood, intent);
    let reply = `💡 ${style} ${mood.label} 분위기의 공간을 골라봤어요.\n\n`;

    if (intent.wantsDifferent) {
      reply = `💡 다른 방향으로 골라봤어요. ${style} 분위기의 곳을 위주로 정리해봤어요.\n\n`;
    } else if (intent.wantsNearby) {
      reply = `💡 가까운 곳 위주로 찾았어요. ${style} 느낌의 공간을 추천해볼게요.\n\n`;
    } else if (intent.wantsMoreQuiet) {
      reply = `💡 더 한적한 곳을 찾고 싶으신 거라면, 이런 곳들이 잘 어울려요.\n\n`;
    }

    reply += descriptions.join('\n\n');
    return reply;
  } catch (err) {
    console.warn('로컬 추천 생성 실패:', err);
    return '현재 추천 기능을 이용할 수 없습니다.';
  }
}

async function callOpenAI(userText, recentMessages = []) {
  const localReply = await buildLocalReply(userText);

  try {
    const key = import.meta.env.VITE_OPENAI_API_KEY;
    if (!key) return localReply;

    const systemMsg = {
      role: 'system',
      content:
        '너는 서울의 조용한 장소를 추천하는 도우미야. 설명은 군더더기 없이 아주 짧고 직관적으로 답해줘.\n\n' +
        '[답변 작성 규칙]\n' +
        '1. 인삿말이나 도입부는 한 줄 이내로 최소화한다.\n' +
        '2. 장소 이름은 반드시 **장소이름** 형식(굵은 글씨)으로 작성한다.\n' +
        '3. 장소마다 1) 이름 2) 구/카테고리 정보 3) 추천 이유를 각각 한 줄씩 줄바꿈하여 간결하게 나열한다.\n' +
        '4. 전체 답변의 총 길이는 6줄 이내로 극도로 짧고 직관적이어야 한다.'
    };

    const messagesPayload = [
      systemMsg,
      ...recentMessages.slice(-6),
      { role: 'user', content: userText },
    ];

    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: messagesPayload,
      }),
    });

    if (!resp.ok) throw new Error(`OpenAI error: ${resp.status}`);

    const data = await resp.json();
    const content = data?.choices?.[0]?.message?.content?.trim();
    return content || localReply;
  } catch (err) {
    console.warn('OpenAI 호출 실패, 로컬 추천으로 대체합니다:', err);
    return localReply;
  }
}

function onKeydown(e) {
  if (e.key === 'Escape' && isOpen.value) isOpen.value = false;
}

onMounted(() => window.addEventListener('keydown', onKeydown));
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown));
</script>

<style scoped>
.chatbot {
  position: fixed;
  right: 20px;
  bottom: 20px;
  z-index: 1000;
  box-sizing: border-box;
  font-family: inherit;
}

/* Floating action button */
.fab {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #4F46E5;
  color: #fff;
  border: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  cursor: pointer;
  box-shadow: 0 6px 18px rgba(160, 219, 242, 0.18);
  transition: transform 0.12s ease;
}
.fab:active {
  transform: scale(0.96);
}

/* Panel */
.panel {
  position: absolute;
  right: 0;
  bottom: 74px;
  background: #fff;
  border-radius: 12px;
  width: min(360px, 92vw);
  max-height: min(600px, 80vh);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0,0,0,0.22), 0 6px 18px rgba(160,219,242,0.08);
  border: 1px solid rgba(160, 219, 242, 0.12);
  backdrop-filter: blur(6px);
}

/* Header */
.panel-header {
  background: #4F46E5;
  color: #fff;
  padding: 12px 16px;
  font-weight: 600;
  text-align: center;
  font-size: 16px;
  display: flex;
  justify-content: center;
  align-items: center;
}

/* Messages area */
.messages {
  padding: 12px;
  flex: 1 1 auto;
  overflow-y: auto;
  background: linear-gradient(180deg, #fbffff, #f7fdfd);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* message layout */
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

/* bubble */
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

/* loading bubble */
.loading-bubble {
  opacity: 0.9;
  font-weight: 600;
  letter-spacing: 2px;
}

/* Composer */
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

/* Transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(6px) scale(0.995);
}

/* 모바일 대응 */
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