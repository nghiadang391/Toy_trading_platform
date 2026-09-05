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
    // Navbar & Footer
    browseToys: "Browse Toys",
    sellAToy: "Sell a Toy",
    messages: "Messages",
    fingerprintConnect: "Fingerprint Connect",
    connecting: "Connecting...",
    connected: "Connected",
    brandAssets: "Brand Assets",

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
    sellerShowQr: "Seller (Show QR)",
    buyerScanVerify: "Buyer (Scan/Verify)",
    instantHandover: "Instant Handover",
    standardHandover: "Standard Handover",
    instantHandoverHint: "Seller: Show this instant payment invoice QR to the buyer at your meetup to receive funds upon handover.",
    standardHandoverHint: "Seller: Show this 1-time handover token QR to the buyer to verify and release escrow funds.",
    buyerScanHint: "Buyer: Point your camera or enter the Seller's QR code to inspect and approve release.",
    switchingToFallback: "Instant route unavailable. Switched to Standard Handover.",
    tokenLabel: "Handover Token:",
    invoiceLabel: "Fiber Invoice:",
    expiryHint: "Expires in 30 minutes",
    verifyAndComplete: "Approve & Release Escrow",
    verifying: "Releasing Escrow...",
    handoverSuccess: "Handover verified! Escrow released to seller and Toy Passport transferred to your collection.",
    noActiveTradeFound: "No active escrow trade found for this toy yet. Initiate a trade or chat with the seller first.",

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
    cat_EDUCATIONAL: "Educational & STEM",
    cat_OUTDOOR: "Outdoor & Sports",
    cat_VEHICLES: "Vehicles & Tracks",
    cat_OTHER: "Other Toys",
    cond_NEW: "New",
    cond_LIKE_NEW: "Like New",
    cond_GOOD: "Good Condition",
    cond_FAIR: "Fair / Well-loved",
    cond_USED: "Used",
    cond_DAMAGED: "Damaged",

    // Why CKB Education Section
    whyCkbTitle: "Why Nervos CKB?",
    whyCkbSubtitle: "A blockchain built for real asset ownership, not fleeting tokens. Here is how CKB powers permanent toy provenance with zero recurring fees.",
    storageTitle: "Storage = Real Ownership",
    storageDesc: "1 CKB = 1 Byte of permanent on-chain storage. Unlike Ethereum NFTs pointing to external servers that can go offline, your toy passport lives directly in the blockchain forever.",
    mintOnceTitle: "Mint Once, Trade Forever",
    mintOnceDesc: "The ~244 CKB capacity is funded only on the toy's first trade. All future resales simply transfer the existing passport on-chain with ₫0 minting fees.",
    recoverableTitle: "100% Recoverable Asset",
    recoverableDesc: "CKB capacity is never burned or wasted like gas fees. If a toy passport is ever retired, the locked 244 CKB can be fully reclaimed.",
    
    // Fee Badges & Breakdown
    passportFeeBadgeNew: "📦 Includes on-chain passport",
    passportFeeBadgeResale: "✨ Verified Passport (₫0 mint fee)",
    passportFeeDetailNewVnd: "Includes ₫30,000 passport mint fee (~244 CKB on-chain capacity). Resales incur ₫0 passport fee.",
    passportFeeDetailNewGbp: "Includes £1.00 passport mint fee (~244 CKB on-chain capacity). Resales incur £0 passport fee.",
    passportFeeDetailResale: "Pre-minted Spore DOB attached. Transfers to new owner with ₫0 mint fee.",
    ckbCapacityLocked: "244 CKB Locked",
    ckbCapacityTooltip: "Permanent on-chain capacity allocated to this Spore DOB cell. Fully recoverable if retired.",
    feeBreakdownLabel: "Transparent Passport Fee",
    firstSaleFeeNotice: "First-time listing: includes ₫30,000 (~£1.00) embedded passport storage fee backing 244 CKB on Nervos CKB.",
    resaleFeeNotice: "Resale item: Existing Spore DOB passport detected! ₫0 passport fee.",
  },
  vi: {
    // Navbar & Footer
    browseToys: "Mua đồ chơi",
    sellAToy: "Đăng thanh lý",
    messages: "Tin nhắn",
    fingerprintConnect: "Đăng nhập bằng vân tay",
    connecting: "Đang kết nối...",
    connected: "Đã kết nối",
    brandAssets: "Tư liệu truyền thông",

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
    sellerShowQr: "Người bán (Hiện mã QR)",
    buyerScanVerify: "Người mua (Quét/Xác nhận)",
    instantHandover: "Giao dịch tức thì",
    standardHandover: "Giao dịch tiêu chuẩn",
    instantHandoverHint: "Người bán: Đưa mã QR này cho người mua quét tại điểm hẹn để nhận tiền thanh toán khi bàn giao đồ chơi.",
    standardHandoverHint: "Người bán: Đưa mã xác thực bàn giao này cho người mua quét để giải phóng tiền ký quỹ.",
    buyerScanHint: "Người mua: Quét mã QR hoặc nhập mã của Người bán để kiểm tra và duyệt giải phóng tiền ký quỹ.",
    switchingToFallback: "Kênh tức thì tạm bận. Đã chuyển sang Giao dịch tiêu chuẩn.",
    tokenLabel: "Mã xác thực:",
    invoiceLabel: "Mã hóa đơn Fiber:",
    expiryHint: "Có hiệu lực trong 30 phút",
    verifyAndComplete: "Duyệt & Giải phóng ký quỹ",
    verifying: "Đang giải phóng ký quỹ...",
    handoverSuccess: "Giao dịch thành công! Tiền đã gửi tới người bán và đồ chơi đã vào bộ sưu tập của bạn.",
    noActiveTradeFound: "Chưa có giao dịch ký quỹ nào cho đồ chơi này. Hãy nhắn tin hoặc bắt đầu giao dịch trước.",

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
    cat_EDUCATIONAL: "Đồ chơi Giáo dục & STEM",
    cat_OUTDOOR: "Đồ chơi Vận động / Thể thao",
    cat_VEHICLES: "Xe mô hình & Đường ray",
    cat_OTHER: "Đồ chơi khác",
    cond_NEW: "Mới 100%",
    cond_LIKE_NEW: "Như mới (99%)",
    cond_GOOD: "Còn tốt",
    cond_FAIR: "Bình thường / Đã dùng nhiều",
    cond_USED: "Đã qua sử dụng",
    cond_DAMAGED: "Có trầy xước / hỏng nhẹ",

    // Why CKB Education Section
    whyCkbTitle: "Vì sao chọn Nervos CKB?",
    whyCkbSubtitle: "Nền tảng blockchain lưu trữ tài sản thực, không phải token ảo. CKB lưu trữ vĩnh viễn lý lịch đồ chơi với chi phí duy nhất một lần.",
    storageTitle: "Dung lượng = Quyền sở hữu thực",
    storageDesc: "1 CKB = 1 Byte lưu trữ vĩnh cửu trên chuỗi. Khác với NFT Ethereum chỉ trỏ về máy chủ ngoài có thể bị sập, lý lịch đồ chơi của bạn được khắc trực tiếp vào blockchain.",
    mintOnceTitle: "Tạo một lần, chuyển nhượng mãi mãi",
    mintOnceDesc: "Dung lượng ~244 CKB chỉ cần tạo duy nhất ở lần giao dịch đầu tiên. Các lần thanh lý tiếp theo chỉ chuyển nhượng cell hiện có với phí tạo 0đ.",
    recoverableTitle: "Tài sản hoàn lại 100%",
    recoverableDesc: "Dung lượng CKB không bao giờ bị đốt mất như phí gas. Nếu sau này lý lịch đồ chơi được giải phóng, 244 CKB bị khóa sẽ được hoàn trả đầy đủ.",

    // Fee Badges & Breakdown
    passportFeeBadgeNew: "📦 Đã gồm phí tạo lý lịch",
    passportFeeBadgeResale: "✨ Đồ chơi đã có lý lịch (Phí tạo 0đ)",
    passportFeeDetailNewVnd: "Đã bao gồm 30.000đ phí đúc lý lịch Spore DOB (tương đương 244 CKB lưu trữ vĩnh viễn). Các lần bán lại sau này không mất phí tạo.",
    passportFeeDetailNewGbp: "Đã bao gồm £1.00 phí đúc lý lịch Spore DOB (tương đương 244 CKB lưu trữ vĩnh viễn). Các lần bán lại sau này không mất phí tạo.",
    passportFeeDetailResale: "Đã có sẵn lý lịch Spore DOB trên CKB. Chuyển nhượng sang chủ mới hoàn toàn miễn phí tạo.",
    ckbCapacityLocked: "Đã khóa 244 CKB",
    ckbCapacityTooltip: "Dung lượng lưu trữ vĩnh viễn trên chuỗi được cấp cho Spore DOB này. Có thể thu hồi lại toàn bộ nếu hủy cell.",
    feeBreakdownLabel: "Minh bạch phí lưu trữ CKB",
    firstSaleFeeNotice: "Đăng bán lần đầu: giá đã bao gồm 30.000đ (~£1.00) phí lưu trữ vĩnh viễn 244 CKB trên Nervos CKB.",
    resaleFeeNotice: "Đồ chơi sang tay: Đã phát hiện lý lịch Spore DOB sẵn có! Phí tạo lý lịch 0đ.",
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
