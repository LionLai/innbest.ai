export type Locale = "zh-TW" | "en" | "ja"

export const locales: Locale[] = ["zh-TW", "en", "ja"]

export const defaultLocale: Locale = "zh-TW"

export const localeToPath: Record<Locale, string> = {
  "zh-TW": "/", // Chinese is at root
  en: "/en",
  ja: "/ja",
}

export const pathToLocale: Record<string, Locale> = {
  "/": "zh-TW",
  "/en": "en",
  "/ja": "ja",
}

export const localeNames: Record<Locale, string> = {
  "zh-TW": "繁體中文",
  en: "English",
  ja: "日本語",
}

export const translations = {
  "zh-TW": {
    // Hero Section
    hero: {
      badge: "東京飯店投資平台",
      title: "東京飯店超額報酬",
      titleHighlight: "由 AI 驅動",
      subtitle: "200+ 客房實績、獨家非公開物件、AI 定價引擎——直接提升 RevPAR 成長",
      roomsManaged: "管理客房數",
      adrUplift: "平均 ADR 提升",
      avgOccupancy: "平均入住率",
      yoyRevpar: "年增 RevPAR",
      bookCall: "預約投資人會議",
      downloadDeck: "下載簡報",
    },
    // Power Stack Section
    powerStack: {
      badge: "核心能力",
      title: "五大核心能力",
      subtitle: "從物件取得到營運優化的完整價值鏈",
      offMarket: {
        title: "非公開物件取得",
        description: "獨家管道接觸東京核心區域未公開飯店物件,降低競爭溢價",
      },
      aiPricing: {
        title: "AI 動態定價",
        description: "機器學習模型即時優化房價,提升 RevPAR 12-18%",
      },
      operations: {
        title: "營運效率提升",
        description: "標準化流程與自動化系統,降低人力成本 30%",
      },
      assetManagement: {
        title: "資產管理專業",
        description: "深度在地團隊,確保物件價值持續提升",
      },
      exitStrategy: {
        title: "退場策略規劃",
        description: "清晰的退場路徑與買家網絡,確保流動性",
      },
    },
    // Performance Timeline Section
    performance: {
      badge: "實績表現",
      title: "過往投資表現",
      subtitle: "數據驗證的投資回報",
      year: "年",
      rooms: "客房數",
      adr: "ADR",
      occupancy: "入住率",
      revpar: "RevPAR",
      irr: "IRR",
    },
    // AI PMS Vision Section
    aiPms: {
      badge: "AI PMS 系統",
      title: "AI 驅動的飯店管理系統",
      subtitle: "下一代智能營運平台",
      dataLayer: {
        title: "數據層",
        description: "PMS、OTA、市場數據整合",
      },
      aiEngine: {
        title: "AI 引擎",
        description: "動態定價、需求預測、收益優化",
      },
      automation: {
        title: "自動化層",
        description: "訂房管理、客戶服務、營運流程",
      },
      insights: {
        title: "洞察儀表板",
        description: "即時 KPI、績效分析、決策支援",
      },
    },
    // Investment Thesis Section
    thesis: {
      badge: "投資論點",
      title: "為何投資東京飯店",
      subtitle: "結構性機會與成長動能",
      inbound: {
        title: "入境旅遊復甦",
        stat: "3,200萬",
        description: "2024 年訪日旅客突破歷史新高,東京為首選目的地",
      },
      supply: {
        title: "供給受限",
        stat: "< 2%",
        description: "東京核心區新增供給有限,供需失衡推升房價",
      },
      yield: {
        title: "收益率優勢",
        stat: "5-7%",
        description: "相較其他亞洲門戶城市,東京飯店提供更佳風險調整報酬",
      },
      tech: {
        title: "科技賦能",
        stat: "+15%",
        description: "AI 與自動化技術顯著提升營運效率與獲利能力",
      },
    },
    // Social Proof Section
    socialProof: {
      badge: "客戶見證",
      title: "投資人怎麼說",
      subtitle: "來自合作夥伴的真實回饋",
      testimonial1: {
        quote: "innbest 團隊的在地專業與 AI 技術整合,讓我們的東京飯店投資組合表現超出預期。",
        author: "陳建志",
        role: "家族辦公室投資長",
      },
      testimonial2: {
        quote: "從物件篩選到營運優化,innbest 提供的是完整解決方案,不只是單純的物件仲介。",
        author: "山田太郎",
        role: "不動産基金經理",
      },
      testimonial3: {
        quote: "透明的數據儀表板與定期報告,讓我們能即時掌握投資表現,這是我們選擇 innbest 的關鍵。",
        author: "Sarah Chen",
        role: "機構投資人",
      },
    },
    // Logo Wall Section
    logoWall: {
      badge: "合作夥伴",
      title: "值得信賴的合作夥伴",
      subtitle: "與領先機構共同成長",
    },
    // CTA Section
    cta: {
      title: "準備好探索東京飯店投資機會?",
      subtitle: "與我們的投資團隊預約 30 分鐘諮詢,了解當前市場機會與投資策略",
      bookCall: "預約投資人會議",
      downloadDeck: "下載投資簡報",
    },
    // Contact & Legal Section
    contact: {
      title: "聯絡我們",
      subtitle: "我們期待與您討論投資機會",
      form: {
        name: "姓名",
        email: "電子郵件",
        company: "公司名稱",
        message: "訊息",
        send: "送出",
        sending: "傳送中...",
      },
      info: {
        title: "聯絡資訊",
        email: "investors@innbest.ai",
        phone: "+81-3-XXXX-XXXX",
        address: "東京都港區 XXX",
      },
      legal: {
        title: "法律聲明",
        disclaimer: "本網站內容僅供參考,不構成投資建議。投資有風險,過往表現不代表未來結果。",
        privacy: "隱私權政策",
        terms: "使用條款",
      },
    },
    // Footer
    footer: {
      tagline: "東京飯店投資與 AI 管理平台",
      product: "產品",
      company: "公司",
      legal: "法律",
      aiPms: "AI PMS 系統",
      investment: "投資服務",
      about: "關於我們",
      careers: "職缺",
      contact: "聯絡我們",
      privacy: "隱私權政策",
      terms: "使用條款",
      disclaimer: "免責聲明",
      rights: "© 2025 innbest.ai 版權所有",
    },
  },
  en: {
    // Hero Section
    hero: {
      badge: "Tokyo Hospitality Investment Platform",
      title: "Tokyo Hospitality Alpha,",
      titleHighlight: "Powered by AI.",
      subtitle:
        "200+ room track record, exclusive off-market properties, AI pricing engine—driving direct RevPAR growth.",
      roomsManaged: "Rooms Managed",
      adrUplift: "Avg ADR Uplift",
      avgOccupancy: "Avg Occupancy",
      yoyRevpar: "YoY RevPAR",
      bookCall: "Book Investor Call",
      downloadDeck: "Download Deck",
    },
    // Power Stack Section
    powerStack: {
      badge: "Core Capabilities",
      title: "Five Core Capabilities",
      subtitle: "Complete value chain from acquisition to operational excellence",
      offMarket: {
        title: "Off-Market Deal Flow",
        description: "Exclusive access to unlisted Tokyo properties in prime locations, reducing competitive premiums",
      },
      aiPricing: {
        title: "AI Dynamic Pricing",
        description: "Machine learning models optimize room rates in real-time, boosting RevPAR by 12-18%",
      },
      operations: {
        title: "Operational Efficiency",
        description: "Standardized processes and automation systems reduce labor costs by 30%",
      },
      assetManagement: {
        title: "Asset Management Expertise",
        description: "Deep local team ensures continuous property value enhancement",
      },
      exitStrategy: {
        title: "Exit Strategy Planning",
        description: "Clear exit pathways and buyer network ensure liquidity",
      },
    },
    // Performance Timeline Section
    performance: {
      badge: "Track Record",
      title: "Historical Performance",
      subtitle: "Data-validated investment returns",
      year: "Year",
      rooms: "Rooms",
      adr: "ADR",
      occupancy: "Occupancy",
      revpar: "RevPAR",
      irr: "IRR",
    },
    // AI PMS Vision Section
    aiPms: {
      badge: "AI PMS System",
      title: "AI-Powered Hotel Management",
      subtitle: "Next-generation intelligent operations platform",
      dataLayer: {
        title: "Data Layer",
        description: "PMS, OTA, and market data integration",
      },
      aiEngine: {
        title: "AI Engine",
        description: "Dynamic pricing, demand forecasting, revenue optimization",
      },
      automation: {
        title: "Automation Layer",
        description: "Booking management, guest services, operational workflows",
      },
      insights: {
        title: "Insights Dashboard",
        description: "Real-time KPIs, performance analytics, decision support",
      },
    },
    // Investment Thesis Section
    thesis: {
      badge: "Investment Thesis",
      title: "Why Tokyo Hospitality",
      subtitle: "Structural opportunities and growth drivers",
      inbound: {
        title: "Inbound Tourism Recovery",
        stat: "32M",
        description: "2024 visitor arrivals hit record highs, with Tokyo as top destination",
      },
      supply: {
        title: "Supply Constraints",
        stat: "< 2%",
        description: "Limited new supply in core Tokyo areas drives pricing power",
      },
      yield: {
        title: "Yield Premium",
        stat: "5-7%",
        description: "Tokyo hotels offer superior risk-adjusted returns vs. other Asian gateway cities",
      },
      tech: {
        title: "Tech Enablement",
        stat: "+15%",
        description: "AI and automation significantly enhance operational efficiency and profitability",
      },
    },
    // Social Proof Section
    socialProof: {
      badge: "Testimonials",
      title: "What Investors Say",
      subtitle: "Real feedback from our partners",
      testimonial1: {
        quote:
          "innbest's local expertise combined with AI technology has exceeded our expectations for Tokyo hotel portfolio performance.",
        author: "James Chen",
        role: "Family Office CIO",
      },
      testimonial2: {
        quote:
          "From property screening to operational optimization, innbest provides complete solutions, not just brokerage.",
        author: "Taro Yamada",
        role: "Real Estate Fund Manager",
      },
      testimonial3: {
        quote:
          "Transparent data dashboards and regular reporting allow us to track investment performance in real-time.",
        author: "Sarah Chen",
        role: "Institutional Investor",
      },
    },
    // Logo Wall Section
    logoWall: {
      badge: "Partners",
      title: "Trusted Partners",
      subtitle: "Growing with leading institutions",
    },
    // CTA Section
    cta: {
      title: "Ready to Explore Tokyo Hotel Investment?",
      subtitle: "Book a 30-minute consultation with our investment team to learn about current market opportunities",
      bookCall: "Book Investor Call",
      downloadDeck: "Download Investment Deck",
    },
    // Contact & Legal Section
    contact: {
      title: "Contact Us",
      subtitle: "We look forward to discussing investment opportunities",
      form: {
        name: "Name",
        email: "Email",
        company: "Company",
        message: "Message",
        send: "Send",
        sending: "Sending...",
      },
      info: {
        title: "Contact Information",
        email: "investors@innbest.ai",
        phone: "+81-3-XXXX-XXXX",
        address: "Minato-ku, Tokyo, Japan",
      },
      legal: {
        title: "Legal Disclaimer",
        disclaimer:
          "Content is for reference only and does not constitute investment advice. Investments carry risks; past performance does not guarantee future results.",
        privacy: "Privacy Policy",
        terms: "Terms of Service",
      },
    },
    // Footer
    footer: {
      tagline: "Tokyo Hotel Investment & AI Management Platform",
      product: "Product",
      company: "Company",
      legal: "Legal",
      aiPms: "AI PMS System",
      investment: "Investment Services",
      about: "About Us",
      careers: "Careers",
      contact: "Contact",
      privacy: "Privacy Policy",
      terms: "Terms of Service",
      disclaimer: "Disclaimer",
      rights: "© 2025 innbest.ai All rights reserved",
    },
  },
  ja: {
    // Hero Section
    hero: {
      badge: "東京ホテル投資プラットフォーム",
      title: "東京ホテル投資の超過収益",
      titleHighlight: "AIで実現",
      subtitle: "200室以上の実績、独占的な非公開物件、AI価格設定エンジン—RevPARの直接的な成長を推進",
      roomsManaged: "管理客室数",
      adrUplift: "平均ADR向上",
      avgOccupancy: "平均稼働率",
      yoyRevpar: "前年比RevPAR",
      bookCall: "投資家面談予約",
      downloadDeck: "資料ダウンロード",
    },
    // Power Stack Section
    powerStack: {
      badge: "コア機能",
      title: "5つのコア機能",
      subtitle: "物件取得から運営最適化までの完全なバリューチェーン",
      offMarket: {
        title: "非公開物件の取得",
        description: "東京中心部の未公開ホテル物件への独占的アクセス、競争プレミアムを削減",
      },
      aiPricing: {
        title: "AI動的価格設定",
        description: "機械学習モデルがリアルタイムで客室料金を最適化、RevPARを12-18%向上",
      },
      operations: {
        title: "運営効率の向上",
        description: "標準化されたプロセスと自動化システムで人件費を30%削減",
      },
      assetManagement: {
        title: "資産管理の専門性",
        description: "深い現地チームが物件価値の継続的な向上を保証",
      },
      exitStrategy: {
        title: "出口戦略の計画",
        description: "明確な出口経路と買い手ネットワークで流動性を確保",
      },
    },
    // Performance Timeline Section
    performance: {
      badge: "実績",
      title: "過去の投資実績",
      subtitle: "データで検証された投資リターン",
      year: "年",
      rooms: "客室数",
      adr: "ADR",
      occupancy: "稼働率",
      revpar: "RevPAR",
      irr: "IRR",
    },
    // AI PMS Vision Section
    aiPms: {
      badge: "AI PMSシステム",
      title: "AI駆動のホテル管理システム",
      subtitle: "次世代インテリジェント運営プラットフォーム",
      dataLayer: {
        title: "データ層",
        description: "PMS、OTA、市場データの統合",
      },
      aiEngine: {
        title: "AIエンジン",
        description: "動的価格設定、需要予測、収益最適化",
      },
      automation: {
        title: "自動化層",
        description: "予約管理、顧客サービス、運営ワークフロー",
      },
      insights: {
        title: "インサイトダッシュボード",
        description: "リアルタイムKPI、パフォーマンス分析、意思決定支援",
      },
    },
    // Investment Thesis Section
    thesis: {
      badge: "投資論点",
      title: "東京ホテル投資の理由",
      subtitle: "構造的機会と成長ドライバー",
      inbound: {
        title: "インバウンド観光の回復",
        stat: "3,200万",
        description: "2024年の訪日客数は過去最高を記録、東京が最優先目的地",
      },
      supply: {
        title: "供給制約",
        stat: "< 2%",
        description: "東京中心部の新規供給は限定的、需給不均衡が価格を押し上げ",
      },
      yield: {
        title: "利回りの優位性",
        stat: "5-7%",
        description: "他のアジアのゲートウェイ都市と比較して、東京のホテルはより良いリスク調整後リターンを提供",
      },
      tech: {
        title: "テクノロジーの活用",
        stat: "+15%",
        description: "AIと自動化技術が運営効率と収益性を大幅に向上",
      },
    },
    // Social Proof Section
    socialProof: {
      badge: "お客様の声",
      title: "投資家の評価",
      subtitle: "パートナーからの実際のフィードバック",
      testimonial1: {
        quote:
          "innbestチームの現地専門知識とAI技術の統合により、東京ホテルポートフォリオのパフォーマンスは期待を上回りました。",
        author: "陳建志",
        role: "ファミリーオフィスCIO",
      },
      testimonial2: {
        quote: "物件選定から運営最適化まで、innbestは単なる物件仲介ではなく、完全なソリューションを提供します。",
        author: "山田太郎",
        role: "不動産ファンドマネージャー",
      },
      testimonial3: {
        quote: "透明なデータダッシュボードと定期的なレポートにより、投資パフォーマンスをリアルタイムで把握できます。",
        author: "Sarah Chen",
        role: "機関投資家",
      },
    },
    // Logo Wall Section
    logoWall: {
      badge: "パートナー",
      title: "信頼できるパートナー",
      subtitle: "主要機関との共同成長",
    },
    // CTA Section
    cta: {
      title: "東京ホテル投資の機会を探る準備はできましたか?",
      subtitle: "投資チームとの30分間のコンサルテーションを予約して、現在の市場機会を学びましょう",
      bookCall: "投資家面談予約",
      downloadDeck: "投資資料ダウンロード",
    },
    // Contact & Legal Section
    contact: {
      title: "お問い合わせ",
      subtitle: "投資機会についてご相談させていただきます",
      form: {
        name: "名前",
        email: "メールアドレス",
        company: "会社名",
        message: "メッセージ",
        send: "送信",
        sending: "送信中...",
      },
      info: {
        title: "連絡先情報",
        email: "investors@innbest.ai",
        phone: "+81-3-XXXX-XXXX",
        address: "東京都港区 XXX",
      },
      legal: {
        title: "法的免責事項",
        disclaimer:
          "本ウェブサイトの内容は参考用であり、投資助言を構成するものではありません。投資にはリスクが伴い、過去の実績は将来の結果を保証するものではありません。",
        privacy: "プライバシーポリシー",
        terms: "利用規約",
      },
    },
    // Footer
    footer: {
      tagline: "東京ホテル投資とAI管理プラットフォーム",
      product: "製品",
      company: "会社",
      legal: "法的情報",
      aiPms: "AI PMSシステム",
      investment: "投資サービス",
      about: "会社概要",
      careers: "採用情報",
      contact: "お問い合わせ",
      privacy: "プライバシーポリシー",
      terms: "利用規約",
      disclaimer: "免責事項",
      rights: "© 2025 innbest.ai 全著作権所有",
    },
  },
} as const
