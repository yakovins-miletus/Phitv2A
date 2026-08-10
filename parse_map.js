import fs from 'fs';

const file = fs.readFileSync('src/shared/components/worldMap.ts', 'utf-8');
const match = file.match(/export const WORLD_DOTS_PATH =\s*"([^"]+)"/);
if (!match) {
  console.log("Could not find WORLD_DOTS_PATH");
  process.exit(1);
}

const path = match[1];
const width = 1440;
const height = 640;
const lonMin = -180;
const lonMax = 180;
const latMin = -60;
const latMax = 78;

const regex = /M(\d+(?:\.\d+)?) (\d+(?:\.\d+)?)h\.01/g;
let execResult;
const coords = [];

while ((execResult = regex.exec(path)) !== null) {
  const x = parseFloat(execResult[1]);
  const y = parseFloat(execResult[2]);
  
  const lon = lonMin + (x / width) * (lonMax - lonMin);
  const lat = latMax - (y / height) * (latMax - latMin);
  
  coords.push([Math.round(lat * 100) / 100, Math.round(lon * 100) / 100]);
}

console.log(`Found ${coords.length} points.`);
fs.writeFileSync('src/features/hero/description/worldDots.json', JSON.stringify(coords));
