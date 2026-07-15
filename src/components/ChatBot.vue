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
        <header class="panel-header">무음 도우미</header>

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
          <button class="send" type="submit" aria-label="전송" :disabled="loading">
            {{ loading ? '전송 중...' : '전송' }}
          </button>
        </form>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted, onBeforeUnmount } from 'vue';

const isOpen = ref(false);
const messages = ref([
  {
    role: 'assistant',
    content:
      '안녕하세요! 조용히 쉬고 싶은 곳을 찾아드릴게요. 지금 어떤 기분이세요?',
  },
]);
const input = ref('');
const loading = ref(false);
const messagesRef = ref(null);

function toggle() {
  isOpen.value = !isOpen.value;
  if (isOpen.value) nextTick(() => scrollToBottom());
}

async function scrollToBottom() {
  await nextTick();
  const el = messagesRef.value;
  if (el) el.scrollTop = el.scrollHeight;
}

function addMessage(role, content) {
  messages.value.push({ role, content });
  scrollToBottom();
}

// 전송 처리 (이미 callOpenAI 호출하도록 연결)
async function send() {
  const text = (input.value || '').trim();
  if (!text || loading.value) return;
  addMessage('user', text);
  input.value = '';
  loading.value = true;

  try {
    const reply = await callOpenAI(text);
    addMessage('assistant', reply);
  } catch (err) {
    addMessage('assistant', '죄송해요. 응답을 가져오는 데 실패했어요.');
  } finally {
    loading.value = false;
  }
}

/*
  callOpenAI: OpenAI Chat Completions 호출 구현
  요구:
  1) import.meta.env.VITE_OPENAI_API_KEY 사용 (없으면 안내 문자열 반환)
  2) public/data/quiet_index_lite.json 로드 -> items 정렬 -> 상위 20개를
     "이름(구·카테고리·조용함점수)" 형태로 join
  3) POST https://api.openai.com/v1/chat/completions (model: gpt-4o-mini)
     - system 메시지에 후보 문자열 포함
     - messages.value의 최근 6개 이어붙이고 마지막에 userText 추가
  4) choices[0].message.content 반환, 실패 시 "추천을 가져오지 못했어요."
  5) 전체를 try/catch로 감싸고 실패 시 콘솔 로그 및
     "죄송해요, 잠시 문제가 생겼어요. (API 키/네트워크 확인 필요)" 반환
*/
async function callOpenAI(userText) {
  try {
    const key = import.meta.env.VITE_OPENAI_API_KEY;
    if (!key) {
      return '(개발용 안내) VITE_OPENAI_API_KEY가 설정되지 않았습니다.';
    }

    // 2) 로컬 JSON 불러오기 (Vite: public/ -> root 경로)
    const jsonPathCandidates = ['/data/quiet_index_lite.json', '/data/quite_index_lite.json'];
    let idxResp = null;
    let idxData = null;
    for (const p of jsonPathCandidates) {
      try {
        idxResp = await fetch(p);
        if (idxResp && idxResp.ok) {
          idxData = await idxResp.json();
          break;
        }
      } catch (e) {
        // 계속 다음 후보 시도
      }
    }
    if (!idxData || !Array.isArray(idxData.items)) {
      throw new Error('Local index load failed');
    }

    const topItems = Array.from(idxData.items)
      .sort((a, b) => (b.q ?? 0) - (a.q ?? 0))
      .slice(0, 20)
      .map((it) => `${it.name}(${it.gu}·${it.cat}·${it.q})`)
      .join(', ');

    // 3) messages 구성: system + 최근 6 + 마지막 user
    const recent = messages.value.slice(-6).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const systemMsg = {
      role: 'system',
      content:
        `너는 지친 사람에게 서울의 조용한 장소를 감성적인 한두 문장으로 추천하는 도우미야. 아래 후보 중에서만 골라 추천해. 축제 일정과 음식점 정보는 데이터가 없어 모른다고 솔직히 말해. 후보: ${topItems}`,
    };

    const apiMessages = [systemMsg, ...recent, { role: 'user', content: userText }];

    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: apiMessages,
      }),
    });

    if (!resp.ok) {
      // 응답 실패
      console.error('OpenAI API error', resp.status, await resp.text());
      return '추천을 가져오지 못했어요.';
    }

    const data = await resp.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) {
      return '추천을 가져오지 못했어요.';
    }
    return content;
  } catch (err) {
    console.error('callOpenAI error:', err);
    return '죄송해요, 잠시 문제가 생겼어요. (API 키/네트워크 확인 필요)';
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
  background: #65c9f0;
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
  /* 강화된 그림자 + 약간의 블러로 배경과 구분 */
  box-shadow: 0 20px 40px rgba(0,0,0,0.22), 0 6px 18px rgba(160,219,242,0.08);
  border: 1px solid rgba(160, 219, 242, 0.12);
  backdrop-filter: blur(6px);
}

/* Header */
.panel-header {
  background: #65c9f0;
  color: #fff;
  padding: 12px 16px;
  font-weight: 600;
  text-align: center;
  font-size: 16px;
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
  line-height: 1.3;
  word-break: break-word;
  box-shadow: 0 2px 8px rgba(160, 219, 242, 0.04);
}
.message.assistant .bubble {
  background: #E9EBEF;
  color: #033b3b;
  border-bottom-left-radius: 6px;
}
.message.user .bubble {
  background: #65c9f0;
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
  border-color: #65c9f0;
}
.send {
  background: #65c9f0;
  color: #fff;
  border: none;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
}
.send:disabled {
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

/* 모바일에서 안전하게 보이도록 여유 */
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