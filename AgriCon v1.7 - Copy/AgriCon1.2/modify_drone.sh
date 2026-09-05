#!/bin/bash
sed -i 's/export const DRONE_FRAMES = \[/import { DRONE_FRAMES, ZoneData } from "..\/data\/droneData";\n\/\/ export const DRONE_FRAMES = \[/g' src/components/DroneOrthomosaicViewer.tsx
