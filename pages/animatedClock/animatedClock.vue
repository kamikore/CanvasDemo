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


function drawClock() {
	// 获取当前时间
	const date = new Date()
	let hours = date.getHours() % 12  	// 0 ~ 11
	let mins = date.getMinutes()		// 0 ~ 59
	let secs = date.getSeconds()		// 0 ~ 59
	
	// 保存初始状态
	ctx.save()
	ctx.strokeStyle = "black"
	ctx.fillStyle = "white"
	ctx.lineWidth = 6
	ctx.lineCap = "round"
	// 时钟中心
	ctx.translate(200, 200);
	
	// 边框
	ctx.save()
	ctx.strokeStyle = "#0069c2"
	ctx.arc(0, 0, 150, 0 , Math.PI * 2 ) 
	ctx.stroke()
	ctx.draw()
	ctx.restore()
	
	// 数字
	ctx.save()
	ctx.fillStyle = 'black'
	ctx.setFontSize(20)
	for(let i = 1; i < 13; i++) {
		const width =  ctx.measureText(i).width / 2
		ctx.beginPath()
		ctx.rotate(Math.PI / 6)			//每次旋转30度
		ctx.fillText(i, -width, -110)
	}
	ctx.draw(true)
	ctx.restore()
	
	// 小时刻度
	ctx.save()
	for(let i = 0; i < 12; i++) {
		ctx.beginPath()
		ctx.moveTo(135, 0)
		ctx.rotate(Math.PI / 6)			//每次旋转30度
		ctx.lineTo(145, 0)
		ctx.stroke()
	}
	ctx.draw(true)
	ctx.restore()
	
	// 分钟刻度
	ctx.save()
	ctx.lineWidth = 4
	for(let i = 0; i < 60; i++) {
		if( i % 5 != 0) {
			ctx.beginPath()
			ctx.moveTo(143,0)
			ctx.lineTo(145, 0)
			ctx.stroke()
		}
		ctx.rotate(Math.PI / 30)		//每次旋转6度
	}
	ctx.draw(true)
	ctx.restore()
	
	
	// 时针
	ctx.save()
	ctx.lineWidth = 12
	ctx.beginPath()
	// 时针一格是30'
	ctx.rotate((Math.PI / 6)  * hours + (Math.PI / 360) * mins + (Math.PI / 21600) * secs)		
	ctx.moveTo(0, 0)
	ctx.lineTo(0, -100)		// 指向12点
	ctx.stroke()
	ctx.draw(true)
	ctx.restore()
	
	// 分针
	ctx.save()
	ctx.lineWidth = 8;
	ctx.beginPath()
	// 时针一格是6'
	ctx.rotate((Math.PI / 30)  * mins + (Math.PI / 1800) * secs)		
	ctx.moveTo(0, 0)
	ctx.lineTo(0, -138)		// 指向12点
	ctx.stroke()
	ctx.draw(true)
	ctx.restore()
	
	// 秒针
	ctx.save()
	ctx.lineWidth = 3;
	ctx.fillStyle = '#ff4677'
	ctx.strokeStyle = '#ff4677'
	ctx.beginPath()
	// 时针一格是 6'
	ctx.rotate((Math.PI / 30) * secs )		
	ctx.arc(0, 0, 5, 0, Math.PI * 2)
	ctx.fill()
	ctx.moveTo(0, 20)
	ctx.lineTo(0, -145)		// 指向12点
	ctx.stroke()
	ctx.draw(true)
	ctx.restore()
	
	// 恢复初始状态
	ctx.restore()
}

onReady(() => {
	// 获取画布像素数据
	uni.canvasGetImageData({
		canvasId: 'canvas',
		x: 0,
		y: 0,
		success: res => {
			setInterval(() => {
				// 每帧需要清空
				ctx.clearRect(0, 0, res.width, res.height)
				drawClock()
			}, 18)
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
