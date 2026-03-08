# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

동대문구 철도 노선 지도 (Dongdaemun-gu Railway Map) - An interactive web application visualizing railway and subway lines in Dongdaemun-gu, Seoul.

## Commands

```bash
npm run dev     # Start development server (Vite)
npm run build   # Build for production
npm run preview # Preview production build
```

## Tech Stack

- **Framework**: React 18 (single JSX file architecture)
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Map Rendering**: SVG-based custom rendering
- **PNG Export**: html-to-image library

## Architecture

The application is contained in a single `src/App.jsx` file with the following structure:

### Data Structures

- **`districts`**: Administrative district boundaries as SVG paths with label positions
- **`stations`**: Railway stations with SVG coordinates and line associations
- **`lines`**: Railway line definitions with colors, station sequences, and planned/active status

### Key Functions

- **`getLineOffset()`**: Calculates parallel offset for overlapping line segments (e.g., Line 1, Gyeongui-Jungang, Gyeongchun between Cheongnyangni and Hoegi)
- **`getOffsetPath()`**: Applies perpendicular offset to line coordinates
- **`handleExportPng()`**: Captures SVG map region as PNG using html-to-image

### Rendering Layers (SVG z-order)

1. Background (dark gray for areas outside Dongdaemun-gu)
2. Dongdaemun-gu fill (light gray)
3. District boundaries (dashed lines)
4. District labels
5. Railway lines (with offset handling for overlapping sections)
6. Station markers (larger circles for transfer stations)

## Railway Lines

| Line | Color | Planned |
|------|-------|---------|
| 1호선 | `#0052A4` | No |
| 2호선(성수지선) | `#00A84D` | No |
| 5호선 | `#996CAC` | No |
| 우이신설선 | `#B7C452` | No |
| 경의중앙선 | `#77C4A3` | No |
| 경춘선 | `#0C8E72` | No |
| 수인분당선 | `#FABE00` | No |
| KTX | `#E0004D` | No |
| GTX-B | `#EA7E2F` | Yes |
| GTX-C | `#8B50A4` | Yes |
| 면목선 | `#D4A76A` | Yes |

Planned lines are rendered with dashed strokes.

## Coordinate System

SVG coordinates are used directly (not lat/lng). The viewBox is `80 120 380 380`. When adding new stations or districts, coordinates should be within this range.
