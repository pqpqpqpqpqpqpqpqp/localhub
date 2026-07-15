<template>
	<div class="chatbot">
		<div class="messages">
			<div v-for="(m, i) in messages" :key="i" :class="['msg', m.role]">
				<strong v-if="m.role === 'user'">You:</strong>
				<strong v-else>Bot:</strong>
				<div class="content">{{ m.content }}</div>
			</div>
		</div>

		<textarea v-model="input" rows="3" placeholder="메시지 입력..."></textarea>

		<div class="controls">
			<input v-model="systemContext" placeholder="시스템 컨텍스트 (옵션)" />
			<button @click="onSend" :disabled="loading">전송</button>
		</div>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { useChatbot } from '../composables/useChatbot';

const { messages, sendMessage } = useChatbot();
const input = ref('');
const systemContext = ref('');
const loading = ref(false);

async function onSend() {
	if (!input.value.trim()) return;
	loading.value = true;
	try {
		const ctx = systemContext.value ? [systemContext.value] : [];
		await sendMessage(input.value, { context: ctx });
		input.value = '';
	} catch (e) {
		console.error(e);
		alert(e.message || String(e));
	} finally {
		loading.value = false;
	}
}
</script>

<style scoped>
.chatbot { border: 1px solid #ddd; padding: 10px; border-radius: 6px; max-width: 720px; }
.messages { max-height: 240px; overflow: auto; margin-bottom: 8px; }
.msg { padding: 6px; border-radius: 4px; margin-bottom: 6px; }
.msg.user { background: #e6f7ff; }
.msg.assistant { background: #f5f5f5; }
.controls { display: flex; gap: 8px; align-items: center; }
textarea { width: 100%; box-sizing: border-box; }
input { flex: 1; }
button { padding: 6px 12px; }
</style>