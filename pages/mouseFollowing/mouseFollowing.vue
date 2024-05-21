<template>
	<view class="page-container">
		<canvas
			style="width: 100%; height: 100%" 
			canvas-id="canvas" 
			class="canvas"
			@touchmove="onTouchmove"
		></canvas>
	</view>
</template>

<script setup>
import { onReady } from '@dcloudio/uni-app'

const ctx = uni.createCanvasContext('canvas')	

let canvasWidth = 0
let canvasHeight  = 0
let m = {
	x: 0,
	y: 0
}
let a = []
let u = 10
let timeId = null

function onTouchmove(e) {
	const {x, y} = e.touches[0]
	console.log('x:', x, 'y:', y)
	m.x = x
	m.y = y
}


function getColor() {
	let s = "0123456789ABCDEF";
	let c = "#";
	for (let i = 0; i < 6; i++) {
	  c += s[Math.ceil(Math.random() * 15)]
	}
	return c
}


function resize() {
	for (let i = 0; i < 1; i++) {
	  let r = 30;
	  let x = Math.random() * (canvasWidth - 2 * r) + r
	  let y = Math.random() * (canvasHeight - 2 * r) + r
	  a[i] = new ob(
		canvasWidth / 2,
		canvasHeight / 2,
		4,
		getColor(),
		Math.random() * 200 + 20,
		0.02
	  )
	}
	
	// 类似雷达扫描
	// a[0] = new ob(canvasWidth / 2, canvasHeight / 2, 80, "red", 0.05, 0.05);
	// a[0].dr();
}


function ob(x, y, r, cc, o, s) {
	this.x = x;
	this.y = y;
	this.r = r;
	this.cc = cc;
	this.theta = Math.random() * Math.PI * 2;	// 分配一个随机弧度
	this.s = s;									// 旋转速度(每次增加的弧度)
	this.o = o;
	this.t = Math.random() * 150;				// 随机值 < 150

	// this.o = o;
	this.dr = () => {
		// 第一次绘制时x,y为圆心, 后续的绘制
		const ls = {
			x: this.x,
			y: this.y,
		}
		
		this.theta += this.s;
		/* 
			利用正弦函数, 余弦函数, 得到一个(x, y) -150 ~ 150 的正方形内的点
			
			为什么可以形成一个圆 ？
			可以把x, y单独看，sin，cos函数都是一个点在 -1 ~ 1 之间规律运动, 因此如
		*/
		this.x = m.x + Math.cos(this.theta) * this.t;		
		this.y = m.y + Math.cos(this.theta) * this.t;
		ctx.beginPath()
		ctx.lineWidth = this.r
		ctx.strokeStyle = this.cc
		ctx.moveTo(ls.x, ls.y)		
		ctx.lineTo(this.x, this.y)	
		ctx.stroke()
		ctx.closePath()
	}
}


function anim() {
	clearInterval(timeId)
	// 可以减缓绘制频率, 观察绘制过程
	timeId = setInterval(anim, 10)
	// ctx.clearRect(0, 0, canvasWidth, canvasHeight)
	ctx.fillStyle = "rgba(0,0,0,0.05)";
	ctx.fillRect(0, 0, canvasWidth, canvasHeight);
	a.forEach((e, i) => {
		e.dr()
	})
	ctx.draw(true)
}

  
onReady(() => {
	// 获取画布像素数据
	
	uni.canvasGetImageData({
		canvasId: 'canvas',
		x: 0,
		y: 0,
		success: res => {
			canvasWidth = res.width
			canvasHeight = res.height
			m.x = canvasWidth / 2
			m.y = canvasHeight / 2
			
			// for(let i = 0; i < 10; i++) {
			// 	let r = 30
			// 	let x = Math.random() * (canvasWidth - 2 * r) + r
			// 	let y = Math.random() * (canvasHeight - 2 * r) + r
			// 	let t = new ob(
			// 		canvasWidth / 2,
			// 		canvasHeight / 2,
			// 		5,
			// 		"red",
			// 		Math.random() * 200 + 20,
			// 		2,
			// 	)
			// 	a.push(t)
			// }
			
			ctx.lineWidth = 2
			ctx.globalAlpha = 0.5
			resize()
			anim()
		}
	})
})	
	
	
</script>


<style lang="scss" scoped>
.page-container {
	height: calc(100vh - var(--status-bar-height) - var(--window-top));
	width: 100vw;
	background-color: rgba(0,0,0,0.05);
}	
	
</style>
