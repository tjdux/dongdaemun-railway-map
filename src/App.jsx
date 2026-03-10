import { useState, useRef, useCallback, useEffect } from "react";
import { toPng } from "html-to-image";

// SVG 뷰박스 설정
const SVG_WIDTH = 500;
const SVG_HEIGHT = 500;
const PADDING = 30;

// 동대문구 좌표 범위 (GeoJSON에서 확인)
const BOUNDS = {
  minLng: 127.02316787780416,
  maxLng: 127.07864451029816,
  minLat: 37.56004560739462,
  maxLat: 37.60933156792092,
};

// 위경도 → SVG 좌표 변환
const lngLatToSvg = (lng, lat) => {
  const x =
    PADDING +
    ((lng - BOUNDS.minLng) / (BOUNDS.maxLng - BOUNDS.minLng)) *
      (SVG_WIDTH - 2 * PADDING);
  const y =
    PADDING +
    ((BOUNDS.maxLat - lat) / (BOUNDS.maxLat - BOUNDS.minLat)) *
      (SVG_HEIGHT - 2 * PADDING);
  return { x, y };
};

// 역 데이터 (실제 위경도 좌표 - 서울교통공사 공식 데이터)
const stationsData = [
  // 동대문구 내 역
  {
    id: "sinseoldong",
    name: "신설동",
    lng: 127.025087,
    lat: 37.575297,
    lines: ["1", "2_seongsu", "ui"],
    isExternal: false,
  },
  {
    id: "jegidong",
    name: "제기동",
    lng: 127.0375,
    lat: 37.578103,
    lines: ["1", "dongbuk"],
    isExternal: false,
  },
  {
    id: "cheongnyangni",
    name: "청량리",
    lng: 127.046835,
    lat: 37.580178,
    lines: [
      "1",
      "gyeongui",
      "gyeongchun",
      "suin",
      "ktx",
      "gtxb",
      "gtxc",
      "myeonmok",
    ],
    isExternal: false,
  },
  {
    id: "hoegi",
    name: "회기",
    lng: 127.057583,
    lat: 37.58946,
    lines: ["1", "gyeongui", "gyeongchun", "ktx", "gtxc"],
    isExternal: false,
  },
  {
    id: "oedaeap",
    name: "외대앞",
    lng: 127.063549,
    lat: 37.596073,
    lines: ["1", "gtxc"],
    forceNormal: true,
    isExternal: false,
  },
  {
    id: "sinimun",
    name: "신이문",
    lng: 127.067325,
    lat: 37.601854,
    lines: ["1", "gtxc"],
    forceNormal: true,
    isExternal: false,
  },
  {
    id: "yongdu",
    name: "용두",
    lng: 127.038091,
    lat: 37.574028,
    lines: ["2_seongsu"],
    isExternal: false,
  },
  // 동대문구 외 역 (노선 연결용)
  {
    id: "dongmyoap",
    name: "동묘앞",
    lng: 127.016429,
    lat: 37.572627,
    lines: ["1"],
    isExternal: true,
  },
  {
    id: "seokgye",
    name: "석계",
    lng: 127.065851,
    lat: 37.614805,
    lines: ["1"],
    isExternal: true,
  },
  // 경춘선 광운대지선 웨이포인트: 신이문 동쪽 우회
  {
    id: "gc_branch_wp1",
    name: "",
    lng: 127.068,
    lat: 37.603,
    lines: ["gyeongchun"],
    isExternal: true,
  },
  {
    id: "gc_branch_wp2",
    name: "",
    lng: 127.066,
    lat: 37.613,
    lines: ["gyeongchun"],
    isExternal: true,
  },
  {
    id: "sindap",
    name: "신답",
    lng: 127.04652,
    lat: 37.57001,
    lines: ["2_seongsu"],
    isExternal: true,
  },
  {
    id: "yongdap",
    name: "용답",
    lng: 127.050899,
    lat: 37.561904,
    lines: ["2_seongsu"],
    isExternal: true,
  },
  {
    id: "seongsu",
    name: "성수",
    lng: 127.052,
    lat: 37.553,
    lines: ["2_seongsu"],
    isExternal: true,
  },
  {
    id: "jungrang",
    name: "중랑",
    lng: 127.076116,
    lat: 37.594917,
    lines: ["gyeongui", "gyeongchun", "ktx"],
    isExternal: true,
  },
  {
    id: "wangsimni",
    name: "왕십리",
    lng: 127.032732,
    lat: 37.561533,
    lines: ["gyeongui", "suin", "gtxb"],
    isExternal: true,
  },
  {
    id: "bomun",
    name: "보문",
    lng: 127.019827,
    lat: 37.584774,
    lines: ["ui"],
    isExternal: true,
  },
  {
    id: "sangbong",
    name: "상봉",
    lng: 127.08559,
    lat: 37.59608,
    lines: ["gyeongui", "ktx", "gyeongchun"],
    isExternal: true,
  },
  {
    id: "sinnae",
    name: "신내",
    lng: 127.085,
    lat: 37.577,
    lines: ["myeonmok"],
    isExternal: true,
  },
  // GTX-B 웨이포인트: 청량리에서 경춘선 방향으로 가다 곡선으로 회기 아래 우회 후 오른쪽으로
  {
    id: "gtxb_bp1",
    name: "",
    lng: 127.052,
    lat: 37.584,
    lines: ["gtxb"],
    isExternal: true,
  },
  {
    id: "gtxb_bp2",
    name: "",
    lng: 127.057,
    lat: 37.587,
    lines: ["gtxb"],
    isExternal: true,
  },
  {
    id: "gtxb_bp3",
    name: "",
    lng: 127.063,
    lat: 37.588,
    lines: ["gtxb"],
    isExternal: true,
  },
  {
    id: "gtxb_exit",
    name: "",
    lng: 127.085,
    lat: 37.593,
    lines: ["gtxb"],
    isExternal: true,
  },
  // 면목선 웨이포인트: 1호선과 전농1·2동 경계 연장선이 만나는 분기점
  {
    id: "myeonmok_wp1",
    name: "",
    lng: 127.053,
    lat: 37.586,
    lines: ["myeonmok"],
    isExternal: true,
  },
  // 면목선 웨이포인트: 전농1동/전농2동 경계를 따라 내려가는 중간점
  {
    id: "myeonmok_wp2",
    name: "",
    lng: 127.057,
    lat: 37.577,
    lines: ["myeonmok"],
    isExternal: true,
  },
  // 면목선 웨이포인트: 전농2동/답십리2동 경계 삼거리점 (세 동이 만나는 지점)
  {
    id: "myeonmok_wp3",
    name: "",
    lng: 127.05763,
    lat: 37.57536,
    lines: ["myeonmok"],
    isExternal: true,
  },
  // 면목선 웨이포인트: 전농2동/답십리2동 경계를 따라 동쪽으로
  {
    id: "myeonmok_wp4",
    name: "",
    lng: 127.06438,
    lat: 37.57644,
    lines: ["myeonmok"],
    isExternal: true,
  },
  {
    id: "seoulstation",
    name: "서울역",
    lng: 127.018,
    lat: 37.569,
    lines: ["gtxb"],
    isExternal: true,
  },
  // KTX 남쪽 출구 웨이포인트: 청량리에서 수직 남하
  {
    id: "ktx_south_exit",
    name: "",
    lng: 127.028,
    lat: 37.555,
    lines: ["ktx"],
    isExternal: true,
  },
  {
    id: "samseong",
    name: "삼성",
    lng: 127.045,
    lat: 37.553,
    lines: ["gtxc"],
    isExternal: true,
  },
  // GTX-C 웨이포인트: 광운대에서 청량리까지 수직 접근
  {
    id: "gtxc_wp1",
    name: "",
    lng: 127.048,
    lat: 37.605,
    lines: ["gtxc"],
    isExternal: true,
  },
  // GTX-C 웨이포인트: 청량리 이후 수인분당선 방향 (서남쪽, 왕십리 방면)
  {
    id: "gtxc_exit",
    name: "",
    lng: 127.025,
    lat: 37.550,
    lines: ["gtxc"],
    isExternal: true,
  },
  {
    id: "gwangundae",
    name: "광운대",
    lng: 127.064,
    lat: 37.619,
    lines: ["1", "gtxc", "gyeongchun"],
    isExternal: true,
  },
  {
    id: "janghanpyeong",
    name: "장한평",
    lng: 127.06364,
    lat: 37.561619,
    lines: ["5"],
    isExternal: false,
  },
  {
    id: "dapsimni5",
    name: "답십리",
    lng: 127.052546,
    lat: 37.567008,
    lines: ["5"],
    showLabel: false,
    isExternal: false,
  },
  // 5호선 답십리-장한평 구간 경유점 (동대문구 남쪽 외곽 경계를 따라)
  {
    id: "line5_wp1",
    name: "",
    lng: 127.056837,
    lat: 37.563766,
    lines: ["5"],
    isExternal: true,
  },
  {
    id: "line5_wp2",
    name: "",
    lng: 127.058203,
    lat: 37.56272,
    lines: ["5"],
    isExternal: true,
  },
  {
    id: "line5_wp3",
    name: "",
    lng: 127.059389,
    lat: 37.562231,
    lines: ["5"],
    isExternal: true,
  },
  {
    id: "line5_wp4",
    name: "",
    lng: 127.063307,
    lat: 37.561484,
    lines: ["5"],
    isExternal: true,
  },
  // 5호선 양쪽 끝 짧은 연장
  {
    id: "ext_line5_west",
    name: "",
    lng: 127.049,
    lat: 37.569,
    lines: ["5"],
    isExternal: true,
  },
  {
    id: "ext_line5_east",
    name: "",
    lng: 127.066,
    lat: 37.5615,
    lines: ["5"],
    isExternal: true,
  },
  // 노선 연장용 가상 포인트 (동대문구 경계 바로 밖)
  {
    id: "ext_jungrang",
    name: "",
    lng: 127.085,
    lat: 37.598,
    lines: ["gyeongchun"],
    isExternal: true,
  },
  {
    id: "ext_wangsimni",
    name: "",
    lng: 127.028,
    lat: 37.553,
    lines: ["gyeongui", "gtxb"],
    isExternal: true,
  },
  {
    id: "korea_univ",
    name: "고려대",
    lng: 127.03601,
    lat: 37.59038,
    lines: ["6", "dongbuk"],
    isExternal: false,
  },
  // 동북선 웨이포인트: 북쪽 진입
  {
    id: "dongbuk_entry",
    name: "",
    lng: 127.036,
    lat: 37.600,
    lines: ["dongbuk"],
    isExternal: true,
  },
  // 동북선 웨이포인트: 고려대 이후 곡선 꺾임
  {
    id: "dongbuk_wp1",
    name: "",
    lng: 127.037,
    lat: 37.586,
    lines: ["dongbuk"],
    isExternal: true,
  },
  {
    id: "dongbuk_wp2",
    name: "",
    lng: 127.038,
    lat: 37.581,
    lines: ["dongbuk"],
    isExternal: true,
  },
  // 동북선 웨이포인트: 남쪽 출구
  {
    id: "dongbuk_exit",
    name: "",
    lng: 127.038,
    lat: 37.565,
    lines: ["dongbuk"],
    isExternal: true,
  },
];

// 역 좌표를 SVG 좌표로 변환
const stations = stationsData.map((s) => {
  const { x, y } = lngLatToSvg(s.lng, s.lat);
  return { ...s, x, y };
});

// 노선 데이터 (동대문구 밖까지 연장)
const lines = [
  {
    id: "1",
    name: "1호선",
    color: "#0052A4",
    stations: [
      "dongmyoap",
      "sinseoldong",
      "jegidong",
      "cheongnyangni",
      "hoegi",
      "oedaeap",
      "sinimun",
      "gwangundae",
      "seokgye",
    ],
    isPlanned: false,
  },
  {
    id: "2_seongsu",
    name: "2호선(성수지선)",
    color: "#00A84D",
    stations: ["sinseoldong", "yongdu", "sindap", "yongdap", "seongsu"],
    isPlanned: false,
  },
  {
    id: "5",
    name: "5호선",
    color: "#996CAC",
    stations: ["ext_line5_west", "dapsimni5", "line5_wp1", "line5_wp2", "line5_wp3", "line5_wp4", "janghanpyeong", "ext_line5_east"],
    isPlanned: false,
  },
    {
    id: "6",
    name: "6호선",
    color: "#CD7C2F",
    stations: ["korea_univ"],
    isPlanned: false,
  },
  {
    id: "ui",
    name: "우이신설선",
    color: "#B7C452",
    stations: ["sinseoldong", "bomun"],
    isPlanned: false,
  },
  {
    id: "gyeongui",
    name: "경의중앙선",
    color: "#77C4A3",
    stations: [
      "ext_wangsimni",
      "wangsimni",
      "cheongnyangni",
      "hoegi",
      "jungrang",
      "sangbong",
    ],
    isPlanned: false,
  },
  {
    id: "gyeongchun",
    name: "경춘선",
    color: "#0C8E72",
    segments: [
      ["cheongnyangni", "hoegi", "jungrang", "sangbong"],
      ["sangbong", "gc_branch_wp1", "gc_branch_wp2", "gwangundae"],
    ],
    isPlanned: false,
  },
  {
    id: "suin",
    name: "수인분당선",
    color: "#FABE00",
    stations: ["wangsimni", "cheongnyangni"],
    isPlanned: false,
  },
  {
    id: "ktx",
    name: "KTX",
    color: "#E0004D",
    stations: ["ktx_south_exit", "cheongnyangni", "hoegi", "jungrang", "sangbong"],
    isPlanned: false,
  },
  {
    id: "gtxb",
    name: "GTX-B",
    color: "#EA7E2F",
    stations: ["ext_wangsimni", "wangsimni", "cheongnyangni", "gtxb_bp1", "gtxb_bp2", "gtxb_bp3", "gtxb_exit"],
    isPlanned: true,
  },
  {
    id: "gtxc",
    name: "GTX-C",
    color: "#8B50A4",
    stations: ["gtxc_exit", "cheongnyangni", "hoegi", "oedaeap", "sinimun", "gwangundae"],
    isPlanned: true,
  },
  {
    id: "myeonmok",
    name: "면목선",
    color: "#D4A76A",
    stations: ["cheongnyangni", "myeonmok_wp1", "myeonmok_wp2", "myeonmok_wp3", "myeonmok_wp4", "sinnae"],
    isPlanned: true,
  },
  {
    id: "dongbuk",
    name: "동북선",
    color: "#E42313",
    stations: ["dongbuk_entry", "korea_univ", "dongbuk_wp1", "dongbuk_wp2", "jegidong", "yongdu", "dongbuk_exit"],
    isPlanned: true,
  },

];

// GeoJSON 좌표를 SVG path 문자열로 변환
const coordsToPath = (coordinates, geometryType) => {
  // MultiPolygon: coordinates[0][0], Polygon: coordinates[0]
  const rings =
    geometryType === "MultiPolygon" ? coordinates[0][0] : coordinates[0];
  if (!rings || rings.length === 0) return "";

  const points = rings.map((coord) => {
    const { x, y } = lngLatToSvg(coord[0], coord[1]);
    return `${x},${y}`;
  });

  return `M ${points.join(" L ")} Z`;
};

// 폴리곤 centroid 계산 (Shoelace formula 기반)
const getPolygonCentroid = (coordinates, geometryType) => {
  const rings =
    geometryType === "MultiPolygon" ? coordinates[0][0] : coordinates[0];
  if (!rings || rings.length === 0) return { x: 0, y: 0 };

  // SVG 좌표로 변환
  const points = rings.map((coord) => lngLatToSvg(coord[0], coord[1]));

  let signedArea = 0;
  let cx = 0;
  let cy = 0;

  for (let i = 0; i < points.length - 1; i++) {
    const x0 = points[i].x;
    const y0 = points[i].y;
    const x1 = points[i + 1].x;
    const y1 = points[i + 1].y;

    const a = x0 * y1 - x1 * y0;
    signedArea += a;
    cx += (x0 + x1) * a;
    cy += (y0 + y1) * a;
  }

  signedArea *= 0.5;
  cx = cx / (6 * signedArea);
  cy = cy / (6 * signedArea);

  return { x: cx, y: cy };
};

// 특정 동에 대한 라벨 위치 수동 조정
const labelOffsets = {
  신설동: { x: 0, y: 15 },
  휘경2동: { x: 10, y: 5 },
  답십리1동: { x: -5, y: 5 },
  장안1동: { x: 5, y: 0 },
  용두동: { x: 27, y: -1 },
  이문2동: {x: 20, y: -15},
  휘경1동: {x: 0, y: -6}
};

const getLabelPosition = (coordinates, geometryType, dongName) => {
  const center = getPolygonCentroid(coordinates, geometryType);
  const offset = labelOffsets[dongName] || { x: 0, y: 0 };
  return {
    x: center.x + offset.x,
    y: center.y + offset.y,
  };
};

// 행정동 이름 추출 (예: "서울특별시 동대문구 회기동" → "회기동")
const extractDongName = (fullName) => {
  const parts = fullName.split(" ");
  return parts[parts.length - 1];
};

// 겹치는 구간의 오프셋 계산
const getLineOffset = (lineId, stationFrom, stationTo) => {
  // 광운대-회기 구간 (1호선 경로): 1호선, GTX-C
  const line1GtxcLines = ["1", "gtxc"];
  const line1GtxcStations = ["gwangundae", "seokgye", "sinimun", "oedaeap", "hoegi"];
  if (
    line1GtxcStations.includes(stationFrom) &&
    line1GtxcStations.includes(stationTo) &&
    stationFrom !== stationTo
  ) {
    const index = line1GtxcLines.indexOf(lineId);
    if (index !== -1) {
      return (index - 0.5) * 4;
    }
  }

  // 동묘앞-청량리 구간 (1호선 경로): 1호선만
  // (KTX는 수인분당선 경로로 이동)

  // 청량리-회기 구간: 1호선, 경의중앙선, 경춘선, KTX, GTX-C
  const cheongnyangniHoegiLines = ["1", "gtxc", "gyeongui", "gyeongchun", "ktx"];
  if (
    (stationFrom === "cheongnyangni" && stationTo === "hoegi") ||
    (stationFrom === "hoegi" && stationTo === "cheongnyangni")
  ) {
    const index = cheongnyangniHoegiLines.indexOf(lineId);
    if (index !== -1) {
      return (index - 2) * 4;
    }
  }
  // 회기-중랑 구간: 경의중앙선, 경춘선, KTX
  const hoegiJungrangLines = ["gyeongui", "gyeongchun", "ktx"];
  if (
    (stationFrom === "hoegi" && stationTo === "jungrang") ||
    (stationFrom === "jungrang" && stationTo === "hoegi")
  ) {
    const index = hoegiJungrangLines.indexOf(lineId);
    if (index !== -1) {
      return (index - 1) * 5;
    }
  }

  // 중랑-상봉 구간: 경의중앙선, 경춘선, KTX
  const cheongnyangniSangbongLines = ["gyeongui", "gyeongchun", "ktx"];
  const cheongnyangniSangbongStations = ["jungrang", "sangbong"];
  if (
    cheongnyangniSangbongStations.includes(stationFrom) &&
    cheongnyangniSangbongStations.includes(stationTo) &&
    stationFrom !== stationTo
  ) {
    const index = cheongnyangniSangbongLines.indexOf(lineId);
    if (index !== -1) {
      return (index - 1) * 5;
    }
  }

  // 청량리 남쪽 구간: 경의중앙선, 수인분당선, GTX-B, KTX, GTX-C
  const southboundLines = [ "suin", "gtxc", "gyeongui", "gtxb", "ktx", ];
  const southboundStations = [
    "ext_wangsimni",
    "wangsimni",
    "cheongnyangni",
    "ktx_south_exit",
    "gtxc_exit",
  ];
  if (
    southboundStations.includes(stationFrom) &&
    southboundStations.includes(stationTo) &&
    stationFrom !== stationTo
  ) {
    const index = southboundLines.indexOf(lineId);
    if (index !== -1) {
      return (index - 2) * 4;
    }
  }
  return 0;
};

// 두 점 사이의 수직 오프셋 적용
const getOffsetPath = (x1, y1, x2, y2, offset) => {
  if (offset === 0) return { x1, y1, x2, y2 };

  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.sqrt(dx * dx + dy * dy);

  const nx = -dy / length;
  const ny = dx / length;

  return {
    x1: x1 + nx * offset,
    y1: y1 + ny * offset,
    x2: x2 + nx * offset,
    y2: y2 + ny * offset,
  };
};

function App() {
  const [geoData, setGeoData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [visibleLines, setVisibleLines] = useState(
    lines.reduce((acc, line) => ({ ...acc, [line.id]: true }), {}),
  );
  const [showStationLabels, setShowStationLabels] = useState(true);
  const mapRef = useRef(null);

  // GeoJSON 데이터 로드
  useEffect(() => {
    fetch("/dongdaemun.geojson")
      .then((res) => res.json())
      .then((data) => {
        setGeoData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("GeoJSON 로드 실패:", err);
        setLoading(false);
      });
  }, []);

  const toggleLine = (lineId) => {
    setVisibleLines((prev) => ({ ...prev, [lineId]: !prev[lineId] }));
  };

  const handleExportPng = useCallback(() => {
    if (mapRef.current === null) return;

    toPng(mapRef.current, {
      cacheBust: true,
      backgroundColor: "#2a2a2a",
      pixelRatio: 2,
    })
      .then((dataUrl) => {
        const link = document.createElement("a");
        link.download = "dongdaemun-railway-map.png";
        link.href = dataUrl;
        link.click();
      })
      .catch((err) => {
        console.error("PNG 저장 실패:", err);
      });
  }, [mapRef]);

  const stationMap = stations.reduce((acc, s) => ({ ...acc, [s.id]: s }), {});

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-xl">지도 데이터 로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-center mb-4">
          동대문구 철도 노선 지도
        </h1>

        <div ref={mapRef} className="bg-gray-800 rounded-lg p-4 mb-4">
          <svg
            viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
            className="w-full h-auto"
            style={{ maxHeight: "850px" }}
          >
            {/* 클리핑 영역 정의 (동대문구 데이터 영역 + 약간의 여백) */}
            <defs>
              <clipPath id="mapClip">
                <rect x={PADDING - 10} y={PADDING - 10} width={SVG_WIDTH - 2 * PADDING + 20} height={SVG_HEIGHT - 2 * PADDING + 20} />
              </clipPath>
            </defs>

            {/* 배경 */}
            <rect
              x="0"
              y="0"
              width={SVG_WIDTH}
              height={SVG_HEIGHT}
              fill="#3a3a3a"
            />

            {/* 행정동 폴리곤 */}
            {geoData &&
              geoData.features.map((feature, idx) => {
                const geometryType = feature.geometry.type;
                const path = coordsToPath(
                  feature.geometry.coordinates,
                  geometryType,
                );
                const dongName = extractDongName(feature.properties.adm_nm);
                const labelPos = getLabelPosition(
                  feature.geometry.coordinates,
                  geometryType,
                  dongName,
                );

                return (
                  <g key={idx}>
                    {/* 행정동 영역 */}
                    <path
                      d={path}
                      fill="#5a5a5a"
                      stroke="#888"
                      strokeWidth="1.5"
                    />
                    {/* 행정동 이름 */}
                    <text
                      x={labelPos.x}
                      y={labelPos.y}
                      fill="#bbb"
                      fontSize="9"
                      fontWeight="500"
                      textAnchor="middle"
                      dominantBaseline="middle"
                    >
                      {dongName}
                    </text>
                  </g>
                );
              })}

            {/* 노선 그리기 (클리핑 적용) */}
            <g clipPath="url(#mapClip)">
              {lines.map((line) => {
                if (!visibleLines[line.id]) return null;
                const allSegments = line.segments || [line.stations];
                if (line.isTerminal || allSegments.every(s => s.length < 2)) return null;

                return allSegments.flatMap((segment, segIdx) =>
                  segment.slice(0, -1).map((stationId, idx) => {
                    const fromStation = stationMap[stationId];
                    const toStation = stationMap[segment[idx + 1]];
                    if (!fromStation || !toStation) return null;

                    const offset = getLineOffset(
                      line.id,
                      stationId,
                      segment[idx + 1],
                    );
                    const { x1, y1, x2, y2 } = getOffsetPath(
                      fromStation.x,
                      fromStation.y,
                      toStation.x,
                      toStation.y,
                      offset,
                    );

                    return (
                      <line
                        key={`${line.id}-seg${segIdx}-${stationId}-${segment[idx + 1]}`}
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke={line.color}
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeDasharray={line.isPlanned ? "8,4" : "none"}
                      />
                    );
                  })
                );
              })}
            </g>

            {/* 노선 이름 라벨 (각 노선 끝점) */}
            {lines.map((line) => {
              if (!visibleLines[line.id]) return null;
              const allSegments = line.segments || [line.stations];
              const labels = [];
              // 노선별 라벨 위치 수동 보정
              const labelAdjust = {
                ui: { dx: 15, dy: 15 },
                "1-seg0-end": { dx: -25, dy: 30 },
                "gyeongui-seg0-start":{ dx: -15, dy: 0}, 
                "gyeongui-seg0-end": { dx: 0, dy: -3 },
                "gyeongchun-seg0-end": { dx: 0, dy: 0 },
                "gtxc-seg0-start": {dx: -17, dy: -10},
                "gtxb-seg0-start": {dx: 35, dy: -10},
                "ktx-seg0-start": {dx: 45, dy: -20},
                "ktx-seg0-end": { dx: 0, dy: 3 },
                "suin-seg0-start": { dx: -22, dy: -25 },
                
              };
              // 시작점에도 라벨을 붙일 노선
              const showStartLabel = ["1", "suin", "dongbuk", "gyeongui", "gtxc", "gtxb", "ktx"];
              const hideEndLabel = ["suin"];
              // 라벨 표시 영역: 동대문구 경계(PADDING) + 20px
              const labelMargin = PADDING - 20;
              const labelRect = { x1: labelMargin, y1: labelMargin, x2: SVG_WIDTH - labelMargin, y2: SVG_HEIGHT - labelMargin };

              // 선분과 사각형 경계의 교차점 계산
              const clipToRect = (ax, ay, bx, by, rect) => {
                let t = 1;
                const dx = bx - ax;
                const dy = by - ay;
                // 각 경계면과의 교차 t값 계산
                if (dx !== 0) {
                  const tLeft = (rect.x1 - ax) / dx;
                  const tRight = (rect.x2 - ax) / dx;
                  if (dx > 0 && tRight < t && tRight > 0) t = tRight;
                  if (dx < 0 && tLeft < t && tLeft > 0) t = tLeft;
                }
                if (dy !== 0) {
                  const tTop = (rect.y1 - ay) / dy;
                  const tBottom = (rect.y2 - ay) / dy;
                  if (dy > 0 && tBottom < t && tBottom > 0) t = tBottom;
                  if (dy < 0 && tTop < t && tTop > 0) t = tTop;
                }
                return { x: ax + dx * t, y: ay + dy * t };
              };

              const addLabel = (eId, aId, key) => {
                const eStation = stationMap[eId];
                const aStation = stationMap[aId];
                if (!eStation || !aStation) return;

                const offset = getLineOffset(line.id, aId, eId);
                const { x1, y1, x2, y2 } = getOffsetPath(
                  aStation.x, aStation.y,
                  eStation.x, eStation.y,
                  offset,
                );

                const isOutside = x2 < labelRect.x1 || x2 > labelRect.x2 || y2 < labelRect.y1 || y2 > labelRect.y2;
                let lx, ly;
                if (isOutside) {
                  const clipped = clipToRect(x1, y1, x2, y2, labelRect);
                  lx = clipped.x;
                  ly = clipped.y;
                } else {
                  const dx = x2 - x1;
                  const dy = y2 - y1;
                  const len = Math.sqrt(dx * dx + dy * dy);
                  lx = x2 + (len > 0 ? dx / len * 10 : 0);
                  ly = y2 + (len > 0 ? dy / len * 10 : 0);
                }

                const adj = labelAdjust[key] || labelAdjust[line.id] || { dx: 0, dy: 0 };
                labels.push(
                  <text
                    key={`label-${key}`}
                    x={lx + adj.dx}
                    y={ly + adj.dy}
                    fill={line.color}
                    fontSize="7"
                    fontWeight="bold"
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    {line.name}
                  </text>
                );
              };

              allSegments.forEach((segment, segIdx) => {
                if (segment.length < 2) return;
                // 끝점 라벨
                if (!hideEndLabel.includes(line.id)) {
                  addLabel(segment[segment.length - 1], segment[segment.length - 2], `${line.id}-seg${segIdx}-end`);
                }
                // 시작점 라벨 (지정된 노선만)
                if (showStartLabel.includes(line.id)) {
                  addLabel(segment[0], segment[1], `${line.id}-seg${segIdx}-start`);
                }
              });

              return labels;
            })}

            {/* 역 마커 (동대문구 내 역만 표시) */}
            {stations
              .filter((s) => !s.isExternal)
              .map((station) => {
                const activeLines = lines.filter(
                  (line) =>
                    visibleLines[line.id] && (line.segments || [line.stations]).some(s => s.includes(station.id)),
                );

                const isTransfer = station.lines.length > 1 && !station.forceNormal;
                const radius = isTransfer ? 7 : 5;

                return (
                  <g key={station.id}>
                    {isTransfer && (
                      <circle
                        cx={station.x}
                        cy={station.y}
                        r={radius + 2}
                        fill="white"
                        stroke="#333"
                        strokeWidth="1"
                      />
                    )}
                    <circle
                      cx={station.x}
                      cy={station.y}
                      r={radius}
                      fill="white"
                      stroke={
                        activeLines.length > 0 ? activeLines[0].color : "#666"
                      }
                      strokeWidth="2"
                    />
                    {showStationLabels && station.showLabel !== false && (
                      <text
                        x={station.x}
                        y={station.labelBelow ? station.y + radius + 13 : station.y - radius - 5}
                        fill="white"
                        fontSize="10"
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        {station.name}
                      </text>
                    )}
                  </g>
                );
              })}
          </svg>

          {/* 범례 (Legend) - 지도 아래 */}
          {(() => {
            const visibleLinesList = lines.filter(
              (line) => visibleLines[line.id],
            );
            if (visibleLinesList.length === 0) return null;

            return (
              <div className="mt-3 pt-3 border-t border-gray-600">
                <div className="text-xs text-gray-400 mb-2 font-semibold">
                  범례
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  {visibleLinesList.map((line) => (
                    <div key={line.id} className="flex items-center gap-2">
                      <div
                        className="w-6 h-1 rounded"
                        style={{
                          background: line.isPlanned
                            ? `repeating-linear-gradient(90deg, ${line.color}, ${line.color} 4px, transparent 4px, transparent 8px)`
                            : line.color,
                        }}
                      />
                      <span className="text-xs text-gray-300">{line.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>

        {/* 노선 토글 버튼 */}
        <div className="bg-gray-800 rounded-lg p-4 mb-4">
          <h2 className="text-sm font-semibold mb-3 text-gray-400">
            노선 필터
          </h2>
          <div className="flex flex-wrap gap-2">
            {lines.map((line) => (
              <button
                key={line.id}
                onClick={() => toggleLine(line.id)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  visibleLines[line.id]
                    ? "text-white shadow-md"
                    : "text-gray-400 bg-gray-700"
                }`}
                style={{
                  backgroundColor: visibleLines[line.id]
                    ? line.color
                    : undefined,
                  border: `2px solid ${line.color}`,
                }}
              >
                {line.name}
                {line.isPlanned && " (예정)"}
              </button>
            ))}
          </div>
        </div>

        {/* 역 이름 토글 버튼 */}
        <div className="bg-gray-800 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-400">
              역 이름 표시
            </h2>
            <button
              onClick={() => setShowStationLabels((prev) => !prev)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                showStationLabels
                  ? "bg-green-600 text-white"
                  : "bg-gray-700 text-gray-400"
              }`}
            >
              {showStationLabels ? "ON" : "OFF"}
            </button>
          </div>
        </div>

        {/* PNG 저장 버튼 */}
        <div className="flex justify-end">
          <button
            onClick={handleExportPng}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            PNG 저장
          </button>
        </div>

        {/* 범례 */}
        <div className="mt-4 bg-gray-800 rounded-lg p-4">
          <h2 className="text-sm font-semibold mb-3 text-gray-400">범례</h2>
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-white border-2 border-gray-400"></div>
              <span className="text-gray-300">일반역</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-white border-2 border-gray-600 ring-2 ring-white"></div>
              <span className="text-gray-300">환승역</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-1 bg-blue-500 rounded"></div>
              <span className="text-gray-300">운행 노선</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-1 rounded"
                style={{
                  background:
                    "repeating-linear-gradient(90deg, #EA7E2F, #EA7E2F 4px, transparent 4px, transparent 8px)",
                }}
              ></div>
              <span className="text-gray-300">예정 노선</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
