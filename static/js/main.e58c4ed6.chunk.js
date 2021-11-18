(this["webpackJsonpmy-app"]=this["webpackJsonpmy-app"]||[]).push([[0],{20:function(e,t,o){},42:function(e,t,o){"use strict";o.r(t);var n=o(1),i=o.n(n),s=o(13),a=o.n(s),r=(o(20),o(3)),l=o.n(r),c=o(14),u=o.n(c),p=o(15),f=o.n(p),d=30,m=480,v=640,g=["a","b","c","d"],h={WAITING:"waiting",COLLECTING:"collecting"},k=60,y=o(0),x=d,b=m,j=v,w=g,L=h,N=L.WAITING,T=L.COLLECTING,C=k,E={video:{audio:!1,height:b,width:j,maxFrameRate:C}},S=function(){var e,t,o,n,i,s,a=N,r=[],c="d",p=!1,d=!1,m=x,v=0,g=!1,h=function(e){var t=e.createDiv();t.style("display","flex"),t.style("direction","row");var o=e.createButton("Play | Reset"),n=e.createButton("Debug"),i=e.createButton("Train");o.parent(t),n.parent(t),i.parent(t),o.mousePressed((function(){return k(e)})),n.mousePressed((function(){return g=!g})),i.mousePressed((function(){return L()}))},k=function(o){if(d){var n;d=!1,m=x,null===(n=t)||void 0===n||n.removeListener("pose",D),o.background(51),o.noLoop()}else{var s;(t=l.a.poseNet(e)).on("pose",D);null===(s=i=l.a.neuralNetwork({inputs:22,outputs:4,task:"classification",debug:!0}))||void 0===s||s.load({model:"mini/model.json",metadata:"mini/model_meta.json",weights:"mini/model.weights.bin"},S),d=!0,o.loop()}},L=function(){(i=l.a.neuralNetwork({inputs:22,outputs:4,task:"classification",debug:!0})).loadData("mini.json",O)},S=function e(){if(o&&o.keypoints&&d&&0!==m){for(var t=[],n=0;n<11;n++){var s=o.keypoints[n].position.x,a=o.keypoints[n].position.y;t.push(s),t.push(a)}i.classify(t,I)}else{if(!d||0===m)return;setTimeout(e,100)}},I=function(e,t){e?console.log("error"):(void 0!==t&&0!==t.lenght&&r.push(t[0].label),20===r.length&&(f()(r)===c&&(p=!0,v++,c=w.filter((function(e){return e!==c}))[Math.floor(Math.random()*w.filter((function(e){return e!==c})).length)]),r=[]),S())},O=function(){i.normalizeData(),i.train({epochs:30},B)},B=function(){i.save()},D=function(e){if(0===e.length)o={};else if(o=e[0].pose,n=e[0].skeleton,a===T){for(var t=[],r=0;r<11;r++){var l=o.keypoints[r].position.x,c=o.keypoints[r].position.y;t.push(l),t.push(c)}var u=[s];i.addData(t,u)}},P=function(e,t){for(var o=0;o<t.length;o++){var i=t[o].position.x,s=t[o].position.y;e.fill(0,255,0),e.ellipse(i,s,16,16)}for(var a=0;a<n.length;a++){var r=n[a][0],l=n[a][1];e.strokeWeight(2),e.stroke(255),e.line(r.position.x,r.position.y,l.position.x,l.position.y)}};return Object(y.jsxs)("div",{children:[Object(y.jsx)("p",{className:"title",children:"Boxing"}),Object(y.jsx)(u.a,{setup:function(t,o){t.frameRate(C),t.createCanvas(j,b,"WEBGL").parent(o),t.background(51),(e=t.createCapture(E)).position(0,0),e.hide(),h(t),t.noLoop()},draw:function(n){var i;d&&(n.push(),n.translate(j,0),n.scale(-1,1),n.image(e,0,0,j,b),void 0!==o&&o.keypoints&&(g&&P(n,o.keypoints),n.pop(),p?(n.fill(0,255,0),p=!1):n.fill(255,0,255),n.noStroke(),n.textSize(100),n.textAlign("CENTER","CENTER"),n.text(c,j/2+220,b/2-110),n.textSize(40),n.fill(255,0,0),n.text(m,j/2+225,b/2-70),n.textSize(20),n.fill(0,255,0),n.text("FPS: ".concat(n.frameRate()),j/2+215,b/2-40),n.fill(255,0,255),n.ellipse(j/2,b/2-20,80,80),n.frameCount%C===0&&m>0&&m--),0===m&&(d=!1,m=x,null===(i=t)||void 0===i||i.removeListener("pose",D),n.background(51),n.textSize(40),n.text("Score: ".concat(v),j/2-150,b/2),n.noLoop(),v=0))},keyPressed:function(e){"s"===e.key?i.saveData():(s=e.key,console.log(s),setTimeout((function(){console.log("collecting"),a=T,setTimeout((function(){console.log("not collecting"),a=N}),6e4)}),1e4))}})]})};a.a.render(Object(y.jsx)(i.a.StrictMode,{children:Object(y.jsx)(S,{})}),document.getElementById("root"))}},[[42,1,2]]]);
//# sourceMappingURL=main.e58c4ed6.chunk.js.map