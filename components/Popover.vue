<template>
	<view class="container">
		<slot></slot>
		<uni-transition mode-class="fade" :show="visible">
			<view class="popover">
				<slot name="content"></slot>
			</view>
		</uni-transition>
		
	</view>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
	visible: {
		type: Boolean,
		default: false
	}
})
	
	
</script>

<style lang="scss" scoped>
.container {
	position: relative;
	display: inline-block;
	
	.popover {
		position: absolute;
		bottom: -20;
		left: 50%;
		transform: translateX(-50%);
		border-radius: 12px;
		padding: 8px 16px;
		background-color: #fff;
		box-shadow: $shadow;
		z-index: 1;
	}
}




</style>