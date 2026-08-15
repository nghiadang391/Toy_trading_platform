"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type Language = "en" | "vi";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Navbar
    browseToys: "Browse Toys",
    sellAToy: "Sell a Toy",
    messages: "Messages",
    fingerprintConnect: "Fingerprint Connect",
    connecting: "Connecting...",
    connected: "Connected",

    // Home Page
    heroTitle: "Trade Kids' Toys Securely with CKB Escrow",
    heroSubtitle: "Don't buy new—trade used toys! Each toy gets an on-chain Toy Passport (Spore DOB) tracking ownership, ratings, and provenance. Settle payments in CKB with hidden wallet complexity.",
    browseMarket: "Browse Market",
    listAToy: "List a Toy",
    escrowTitle: "CKB Trust Escrow",
    escrowDesc: "Locked smart contracts ensure CKB payments are only released when both parties confirm meetup or shipping delivery.",
    passportTitle: "Toy Passport DOB",
    passportDesc: "Every toy has an on-chain ownership timeline (Spore DOB NFT) containing verification data that transfers with the trade.",
    lensTitle: "Visual Reference Price",
    lensDesc: "Google Lens visual shopping lookup checks the average market price of the toy so you get a fair deal.",

    // Listings Page
    browseUsedToys: "Browse Used Toys",
    loadingListings: "Loading listings...",
    noToysYet: "No toys listed for trade yet. Be the first to list one!",
    listAToyNow: "List a Toy Now",
    method: "Method",
    region: "Region",
    safetyChecked: "Safety Checked",
    recalled: "Recalled",
    sellerPrice: "Seller Price",
    marketReference: "Market Reference",
    settleCost: "Settle Cost",
    overpriced: "Overpriced",
    feedOffline: "Feed Offline",
    passportBtn: "Passport",
    handoverBtn: "Handover",
    chatBtn: "Chat",
    listedBy: "Listed by",
    method_MEETUP: "Meetup",
    method_SHIPPING: "Shipping",
    method_BOTH: "Meetup or Shipping",

    // Chat Modal
    chattingWith: "Chatting with",
    connectingPrivateChannel: "Connecting private channel...",
    noMessagesYet: "No messages yet. Say hello to start discussing the trade!",
    typeMessageHere: "Type your message here...",
    send: "Send",
    suggestion1: "Is this item still available?",
    suggestion2: "Can you send more photos?",
    suggestion3: "Where can we meet?",

    // Handover Modal
    handoverTitle: "Meetup Handover",
    buyerShowQr: "Buyer (Show QR)",
    sellerScanVerify: "Seller (Scan/Verify)",
    instantHandover: "Instant Handover",
    standardHandover: "Standard Handover",
    instantHandoverHint: "Show this instant invoice QR code to the seller at your meetup to complete payment in sub-second.",
    standardHandoverHint: "Show this 1-time handover token QR to the seller at your meetup to complete standard escrow.",
    switchingToFallback: "Instant route unavailable. Switched to Standard Handover. Processing may take a few moments—thank you for your patience.",
    tokenLabel: "Handover Token:",
    invoiceLabel: "Fiber Invoice:",
    expiryHint: "Expires in 30 minutes",
    verifyAndComplete: "Verify and Complete Handover",
    verifying: "Verifying...",
    handoverSuccess: "Handover completed successfully! Toy Passport transferred.",

    // Sell Form
    sellTitle: "Sell a Toy",
    sellSubtitle: "List your kids' outgrown toys and secure transaction payment in CKB.",
    toyName: "Toy Name",
    toyNamePlaceholder: "e.g. LEGO Star Wars Millennium Falcon",
    descriptionLabel: "Description",
    descriptionPlaceholder: "Describe the condition, missing pieces, features, etc.",
    priceLabel: "Price",
    currencyLabel: "Currency",
    categoryLabel: "Category",
    conditionLabel: "Condition",
    tradeMethodLabel: "Trade Method",
    regionLabel: "Region",
    locationLabel: "Meetup Location / Detail Address",
    locationPlaceholder: "e.g. Hammersmith, London or District 1, HCMC",
    mediaLabel: "Photos & Videos",
    mediaSubtitle: "Upload photos or short video clips showing the toy's real condition.",
    uploadButton: "Upload Media",
    uploadHint: "Supports PNG, JPG, WebP, MP4, WebM (Max 15MB)",
    orPasteUrl: "Or paste image/video URL:",
    addUrlBtn: "Add URL",
    submitListingBtn: "List Toy for Trade",
    submittingListingBtn: "Listing Toy...",
    cat_BUILDING_SETS: "Building Sets",
    cat_ACTION_FIGURES: "Action Figures",
    cat_DOLLS: "Dolls",
    cat_PUZZLES: "Puzzles",
    cat_BOARD_GAMES: "Board Games",
    cond_NEW: "New",
    cond_LIKE_NEW: "Like New",
    cond_USED: "Used",
    cond_DAMAGED: "Damaged",
  },
  vi: {
    // Navbar
    browseToys: "Mua đồ chơi",
    sellAToy: "Đăng thanh lý",
    messages: "Tin nhắn",
    fingerprintConnect: "Đăng nhập bằng vân tay",
    connecting: "Đang kết nối...",
    connected: "Đã kết nối",

    // Home Page
    heroTitle: "Trao đổi đồ chơi cũ an toàn qua CKB Escrow",
    heroSubtitle: "Không cần mua mới—hãy thanh lý và trao đổi đồ chơi cũ! Mỗi sản phẩm sẽ có một dòng lịch sử đồ chơi (Spore DOB) ghi lại nguồn gốc, chủ sở hữu và lịch sử giao dịch. Thanh toán bằng CKB cực kỳ nhanh chóng và an toàn.",
    browseMarket: "Dạo Chợ",
    listAToy: "Đăng thanh lý",
    escrowTitle: "Giao dịch an toàn qua CKB",
    escrowDesc: "Tiền (CKB) được khóa an toàn trong hợp đồng thông minh và chỉ giải phóng khi cả hai bên xác nhận đã bàn giao đồ chơi thành công.",
    passportTitle: "Lịch sử đồ chơi (Spore DOB)",
    passportDesc: "Mỗi món đồ chơi đều sở hữu một lý lịch trích ngang trên chuỗi blockchain dưới dạng NFT để theo dõi người dùng cũ và chất lượng.",
    lensTitle: "Tra cứu giá trị thực tế",
    lensDesc: "Tự động so sánh hình ảnh bằng Google Lens để ước tính giá trị trung bình trên thị trường, giúp bạn mua bán đúng giá.",

    // Listings Page
    browseUsedToys: "Chợ Đồ Chơi Cũ",
    loadingListings: "Đang tải danh sách đồ chơi...",
    noToysYet: "Chưa có đồ chơi nào được đăng bán. Hãy là người đầu tiên đăng nhé!",
    listAToyNow: "Đăng bán ngay",
    method: "Giao dịch",
    region: "Khu vực",
    safetyChecked: "Đã kiểm định an toàn",
    recalled: "Cảnh báo thu hồi",
    sellerPrice: "Giá thanh lý",
    marketReference: "Giá tham khảo",
    settleCost: "Thanh toán bằng CKB",
    overpriced: "Giá hơi cao",
    feedOffline: "Ngoại tuyến",
    passportBtn: "Lý lịch",
    handoverBtn: "Bàn giao",
    chatBtn: "Nhắn tin",
    listedBy: "Đăng bởi",
    method_MEETUP: "Gặp mặt trực tiếp",
    method_SHIPPING: "Giao hàng (Ship)",
    method_BOTH: "Gặp mặt hoặc Giao hàng",

    // Chat Modal
    chattingWith: "Nhắn tin với",
    connectingPrivateChannel: "Đang kết nối kênh chat an toàn...",
    noMessagesYet: "Chưa có tin nhắn nào. Nhắn tin ngay để bắt đầu trao đổi nhé!",
    typeMessageHere: "Nhập tin nhắn...",
    send: "Gửi",
    suggestion1: "Sản phẩm này còn không ạ?",
    suggestion2: "Bạn có thể chụp thêm ảnh không?",
    suggestion3: "Địa chỉ giao dịch ở đâu vậy bạn?",

    // Handover Modal
    handoverTitle: "Bàn giao tại điểm hẹn",
    buyerShowQr: "Người mua (Hiện mã QR)",
    sellerScanVerify: "Người bán (Quét/Xác nhận)",
    instantHandover: "Giao dịch tức thì",
    standardHandover: "Giao dịch tiêu chuẩn",
    instantHandoverHint: "Đưa mã QR thanh toán tức thì này cho người bán quét tại điểm hẹn để hoàn tất giao dịch trong tích tắc.",
    standardHandoverHint: "Đưa mã xác thực này cho người bán quét tại điểm hẹn để hoàn tất ký quỹ tiêu chuẩn.",
    switchingToFallback: "Kênh tức thì tạm bận. Đã tự động chuyển sang Giao dịch tiêu chuẩn. Quá trình xử lý có thể mất thêm ít phút, vui lòng kiên nhẫn đợi trong giây lát.",
    tokenLabel: "Mã xác thực:",
    invoiceLabel: "Mã hóa đơn Fiber:",
    expiryHint: "Có hiệu lực trong 30 phút",
    verifyAndComplete: "Xác nhận và Hoàn tất bàn giao",
    verifying: "Đang xác thực...",
    handoverSuccess: "Giao dịch thành công tức thì! Đã chuyển giao thông tin đồ chơi.",

    // Sell Form
    sellTitle: "Đăng bán đồ chơi",
    sellSubtitle: "Đăng thanh lý đồ chơi cũ của bé và nhận thanh toán an toàn qua CKB.",
    toyName: "Tên đồ chơi",
    toyNamePlaceholder: "Ví dụ: Bộ xếp hình LEGO Star Wars Millennium Falcon",
    descriptionLabel: "Mô tả chi tiết",
    descriptionPlaceholder: "Mô tả tình trạng đồ chơi, các phụ kiện đi kèm, đặc điểm nổi bật...",
    priceLabel: "Giá bán",
    currencyLabel: "Tiền tệ",
    categoryLabel: "Danh mục",
    conditionLabel: "Tình trạng",
    tradeMethodLabel: "Phương thức giao dịch",
    regionLabel: "Khu vực",
    locationLabel: "Địa điểm hẹn gặp / Địa chỉ",
    locationPlaceholder: "Ví dụ: Quận 1, TP.HCM hoặc Hammersmith, London",
    mediaLabel: "Hình ảnh & Video đồ chơi",
    mediaSubtitle: "Tải lên hình ảnh hoặc video ngắn quay tình trạng thực tế của đồ chơi.",
    uploadButton: "Tải ảnh / Video từ máy",
    uploadHint: "Hỗ trợ PNG, JPG, WebP, MP4, WebM (Tối đa 15MB)",
    orPasteUrl: "Hoặc dán đường dẫn ảnh / video URL:",
    addUrlBtn: "Thêm",
    submitListingBtn: "Đăng thanh lý ngay",
    submittingListingBtn: "Đang đăng...",
    cat_BUILDING_SETS: "Bộ xếp hình",
    cat_ACTION_FIGURES: "Mô hình nhân vật",
    cat_DOLLS: "Búp bê",
    cat_PUZZLES: "Trò chơi ghép hình",
    cat_BOARD_GAMES: "Board Games",
    cond_NEW: "Mới 100%",
    cond_LIKE_NEW: "Như mới (99%)",
    cond_USED: "Đã qua sử dụng",
    cond_DAMAGED: "Có trầy xước / thiếu mảnh",
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");

  // Load language from localStorage if available (client-side only)
  useEffect(() => {
    const stored = localStorage.getItem("toytrade_lang") as Language;
    if (stored === "en" || stored === "vi") {
      setLanguageState(stored);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("toytrade_lang", lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
