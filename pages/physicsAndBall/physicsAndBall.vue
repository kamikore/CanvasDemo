<template>
	<view class="page-container">
		<canvas
			style="width: 100%; height: 100%" 
			canvas-id="canvas" 
			class="canvas"
		></canvas>
	</view>
</template>

<script setup>
import { onReady } from '@dcloudio/uni-app'

const ctx = uni.createCanvasContext('canvas')	
let canvasWidth = 0
let canvasHeight = 0

const ball = {
	x: 100,
	y: 100,
	vx: 5,			// x轴方向速率
	vy: 2,			// y轴方向速率
	radius: 25,
	color: "blue",
	draw: function () {
		ctx.beginPath()
		ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, true)
		ctx.closePath()
		ctx.fillStyle = this.color
		ctx.fill()
		ctx.draw(true)
	}
}


function draw() {
	// ctx.clearRect(0, 0, canvasWidth, canvasHeight);
	ctx.fillStyle = 'rgba(255,255,255, 0.2)'
	ctx.fillRect(0, 0, canvasWidth, canvasHeight)
	ball.draw();
	// 给予小球速度
	ball.x += ball.vx;
	ball.y += ball.vy;
	
	/* 
		逐帧减少垂直方向的速度，所以小球最终将只会在地板上弹跳，但不会减至0。
	 */
	ball.vy *= 0.98;
	ball.vy += 0.25;

	// 边界碰撞检测
	if (ball.y + ball.vy > canvasHeight || ball.y + ball.vy < 0) {
		ball.vy = -ball.vy;		// 反向速率
	}

	if (ball.x + ball.vx > canvasWidth || ball.x + ball.vx < 0) {
		ball.vx = -ball.vx;		// 反向速率
	}
}


onReady(() => {
	ctx.fillStyle = 'rgba(255, 0, 0, 0.2)'
	ctx.fillRect(0, 0, 534, 717)
	ctx.draw()
	// 获取画布像素数据
	uni.canvasGetImageData({
		canvasId: 'canvas',
		x: 0,
		y: 0,
		width: 534,
		height: 717,
		success: res => {
			console.log(res.data)
			canvasWidth = res.width
			canvasHeight = res.height
		
			ball.draw()
			
			// setInterval(draw, 18)
		}
	})
})	
	
	
</script>


<style lang="scss" scoped>
.page-container {
	height: calc(100vh - var(--status-bar-height) - var(--window-top));
	width: 100vw;
}	
	
</style>
