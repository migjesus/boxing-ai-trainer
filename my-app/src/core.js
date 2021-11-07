import * as poseDetection from "@tensorflow-models/pose-detection";
import "@mediapipe/pose";

export const detections = async (stream) => {
  const model = poseDetection.SupportedModels.BlazePose;
  const detectorConfig = {
    runtime: "mediapipe",
    modelType: "full",
  };
  const detector = await poseDetection.createDetector(model, detectorConfig);

  const video = document.getElementById(stream);

  const poses = await detector.estimatePoses(video);

  return poses;
};

export const drawDetections = (detections, canvasRef) => {
  var canvas = canvasRef.current;
  var ctx = canvas.getContext("2d");
  /*  detections.forEach((detection) => {
    ctx.beginPath();
    ctx.ellipse(detection.x, detection.y, 50, 50, 2 * Math.PI, 0, 2 * Math.PI);
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#FF0000";
    //ctx.fillStyle = "#FF0000";
    ctx.stroke();
  });*/

  ctx.beginPath();
  ctx.ellipse(
    detections[0].x,
    detections[0].y,
    30,
    30,
    2 * Math.PI,
    0,
    2 * Math.PI
  );
  ctx.lineWidth = 3;
  ctx.strokeStyle = "#FF0000";
  ctx.fillStyle = "#FF0000";
  ctx.stroke();
};
