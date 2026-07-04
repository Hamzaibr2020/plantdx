export interface TreatmentInfo {
  diseaseKeyTr: string;
  chemical: {
    activeIngredient: string;
    exampleProducts: string[];
    doseLabel: string; // dekar başına
    doseMlPer100L?: number; // sulandırma oranı referansı
    applicationIntervalDays: number;
    preHarvestIntervalDays: number;
  };
  organic: {
    method: string;
    effectivenessPercent: number; // yaklaşık, literatür bazlı genel aralık
    applicationIntervalDays: number;
  };
  biologicalControl: string; // faydalı böcek/doğal düşman/biyopreparat tabanlı mücadele
  safetyEquipment: string[];
  mixingWarnings: string[];
  wateringAdvice: string;
  estimatedRecoveryDays: number; // düzenli tedavi ile beklenen iyileşme/kontrol süresi
  isAiGenerated?: boolean; // yerel veritabanında olmayan hastalıklar için Gemini üretimi işareti
}

export const TREATMENT_DB: Record<string, TreatmentInfo> = {
  "Domates Geç Yanıklık": {
    diseaseKeyTr: "Domates Geç Yanıklık",
    chemical: {
      activeIngredient: "Mankozeb + Metalaksil-M",
      exampleProducts: ["Ridomil Gold MZ", "Mankozeb 80 WP"],
      doseLabel: "250-300 g/dekar",
      doseMlPer100L: 250,
      applicationIntervalDays: 7,
      preHarvestIntervalDays: 7,
    },
    organic: {
      method: "Bakır bazlı bordo bulamacı (%1) haftalık uygulama, alt yaprakların budanması, sık dikimden kaçınma",
      effectivenessPercent: 55,
      applicationIntervalDays: 7,
    },
    biologicalControl: "Bacillus subtilis içeren biyofungisitler (örn. Serenade) önleyici olarak kullanılabilir; hastalık başladıktan sonra tek başına yetersiz kalır.",
    safetyEquipment: ["Eldiven", "Maske (FFP2)", "Koruyucu gözlük", "Uzun kollu kıyafet"],
    mixingWarnings: ["Alkali özellikli ürünlerle karıştırmayın", "Sıcak günlerde (>28°C) uygulamayın"],
    wateringAdvice: "Uygulamadan sonra 24 saat yaprak ıslatmayın, damla sulama tercih edin.",
    estimatedRecoveryDays: 14,
  },
  "Domates Erken Yanıklık": {
    diseaseKeyTr: "Domates Erken Yanıklık",
    chemical: {
      activeIngredient: "Klorotalonil",
      exampleProducts: ["Bravo 500 SC", "Klorotalonil 75 WP"],
      doseLabel: "150-200 ml/dekar",
      doseMlPer100L: 200,
      applicationIntervalDays: 10,
      preHarvestIntervalDays: 5,
    },
    organic: {
      method: "Kükürt bazlı ürünler, alt yaprak temizliği, dengeli azot gübrelemesi (aşırı azottan kaçının)",
      effectivenessPercent: 50,
      applicationIntervalDays: 10,
    },
    biologicalControl: "Trichoderma harzianum bazlı toprak uygulamaları kök bölgesi direncini artırabilir.",
    safetyEquipment: ["Eldiven", "Maske", "Koruyucu gözlük"],
    mixingWarnings: ["Yağlı spreylerle aynı gün uygulamayın"],
    wateringAdvice: "Sabah erken saatlerde sulama yapın, akşam sulamadan kaçının.",
    estimatedRecoveryDays: 12,
  },
  "Domates Bakteriyel Leke": {
    diseaseKeyTr: "Domates Bakteriyel Leke",
    chemical: {
      activeIngredient: "Bakır hidroksit + Mankozeb",
      exampleProducts: ["Kocide 2000", "Bakır Hidroksit 50 WP"],
      doseLabel: "200-250 g/dekar",
      doseMlPer100L: 200,
      applicationIntervalDays: 7,
      preHarvestIntervalDays: 5,
    },
    organic: {
      method: "Bakır bazlı ürünler (organik sertifikalı formları mevcut), enfekte bitki artıklarının uzaklaştırılması, tohum dezenfeksiyonu",
      effectivenessPercent: 45,
      applicationIntervalDays: 7,
    },
    biologicalControl: "Bakteriyel hastalıklarda biyolojik mücadele seçenekleri sınırlıdır; önleme (temiz tohum, alet dezenfeksiyonu) esastır.",
    safetyEquipment: ["Eldiven", "Maske", "Koruyucu gözlük"],
    mixingWarnings: ["Yağmur öncesi uygulamayın, yıkanma etkinliği azaltır"],
    wateringAdvice: "Damla sulama zorunlu; yağmurlama bakteriyi yayar.",
    estimatedRecoveryDays: 18,
  },
  "Domates Yaprak Küfü": {
    diseaseKeyTr: "Domates Yaprak Küfü",
    chemical: {
      activeIngredient: "Klorotalonil",
      exampleProducts: ["Bravo 500 SC"],
      doseLabel: "150-200 ml/dekar",
      applicationIntervalDays: 10,
      preHarvestIntervalDays: 5,
    },
    organic: {
      method: "Sera havalandırmasını artırma, nem oranını %85'in altında tutma, alt yaprak temizliği",
      effectivenessPercent: 55,
      applicationIntervalDays: 10,
    },
    biologicalControl: "Sera koşullarında nem kontrolü tek başına çoğu zaman yeterlidir; bu hastalık esas olarak kültürel önlemle yönetilir.",
    safetyEquipment: ["Eldiven", "Maske"],
    wateringAdvice: "Sera içi nemi düşürecek şekilde sabah sulaması yapın.",
    mixingWarnings: [],
    estimatedRecoveryDays: 10,
  },
  "Domates Septoria Yaprak Lekesi": {
    diseaseKeyTr: "Domates Septoria Yaprak Lekesi",
    chemical: {
      activeIngredient: "Klorotalonil / Mankozeb",
      exampleProducts: ["Bravo 500 SC", "Mankozeb 80 WP"],
      doseLabel: "180-220 ml/dekar",
      applicationIntervalDays: 7,
      preHarvestIntervalDays: 5,
    },
    organic: {
      method: "Bakır bazlı spreyler, alt yaprakların budanması, malçlama ile toprak sıçramasının önlenmesi",
      effectivenessPercent: 50,
      applicationIntervalDays: 7,
    },
    biologicalControl: "Malçlama, toprak kaynaklı spor sıçramasını fiziksel olarak azaltarak dolaylı biyolojik koruma sağlar.",
    safetyEquipment: ["Eldiven", "Maske", "Koruyucu gözlük"],
    mixingWarnings: ["Hasat öncesi son 5 gün uygulama yapmayın"],
    wateringAdvice: "Toprak sıçramasını önlemek için malç kullanın, tepe sulamadan kaçının.",
    estimatedRecoveryDays: 14,
  },
  "Domates Hedef Leke Hastalığı": {
    diseaseKeyTr: "Domates Hedef Leke Hastalığı",
    chemical: {
      activeIngredient: "Azoksistrobin",
      exampleProducts: ["Amistar", "Azoksistrobin 25 SC"],
      doseLabel: "80-100 ml/dekar",
      applicationIntervalDays: 10,
      preHarvestIntervalDays: 3,
    },
    organic: {
      method: "Bakır bazlı ürünler, bitki sıklığını azaltma, rotasyon",
      effectivenessPercent: 45,
      applicationIntervalDays: 10,
    },
    biologicalControl: "3-4 yıllık ürün rotasyonu, toprakta patojen birikimini azaltan en etkili biyolojik-kültürel önlemdir.",
    safetyEquipment: ["Eldiven", "Maske", "Koruyucu gözlük"],
    mixingWarnings: ["Aynı etken maddeyi art arda 2'den fazla uygulamayın (direnç riski)"],
    wateringAdvice: "Damla sulama tercih edin.",
    estimatedRecoveryDays: 16,
  },
  "Domates Sarı Yaprak Kıvırcıklığı Virüsü": {
    diseaseKeyTr: "Domates Sarı Yaprak Kıvırcıklığı Virüsü",
    chemical: {
      activeIngredient: "Doğrudan tedavi yok — vektör (beyaz sinek) kontrolü: İmidakloprid",
      exampleProducts: ["Confidor", "İmidakloprid 20 SL"],
      doseLabel: "40-50 ml/dekar",
      applicationIntervalDays: 14,
      preHarvestIntervalDays: 14,
    },
    organic: {
      method: "Sarı yapışkan tuzaklar, beyaz sinek ağı (35 mesh), enfekte bitkilerin hemen sökülmesi",
      effectivenessPercent: 35,
      applicationIntervalDays: 7,
    },
    biologicalControl: "Encarsia formosa (parazitoit arı) beyaz sinek popülasyonunu doğal olarak baskılayabilir; sera koşullarında etkilidir.",
    safetyEquipment: ["Eldiven", "Maske"],
    mixingWarnings: ["Virüs bulaşmış bitkiler tedavi edilemez — sökülüp uzaklaştırılmalı, imha edilmeli"],
    wateringAdvice: "Sulama hastalığı etkilemez; vektör (beyaz sinek) kontrolü esastır.",
    estimatedRecoveryDays: 0,
  },
  "Domates Mozaik Virüsü": {
    diseaseKeyTr: "Domates Mozaik Virüsü",
    chemical: {
      activeIngredient: "Doğrudan kimyasal tedavi yoktur",
      exampleProducts: [],
      doseLabel: "Uygulanamaz",
      applicationIntervalDays: 0,
      preHarvestIntervalDays: 0,
    },
    organic: {
      method: "Enfekte bitkilerin sökülmesi, alet ve el dezenfeksiyonu (yağsız süt veya %10 çamaşır suyu), dayanıklı çeşit kullanımı",
      effectivenessPercent: 20,
      applicationIntervalDays: 0,
    },
    biologicalControl: "Virüs için biyolojik tedavi yoktur; önleme (dayanıklı çeşit, sertifikalı tohum, alet hijyeni) tek etkili yöntemdir.",
    safetyEquipment: ["Eldiven"],
    mixingWarnings: ["Sigara içen kişiler bitkilere dokunmadan önce el yıkamalı (TMV tütünle bulaşabilir)"],
    wateringAdvice: "Sulama hastalığı etkilemez.",
    estimatedRecoveryDays: 0,
  },
  "Domates Kırmızı Örümcek Zararı": {
    diseaseKeyTr: "Domates Kırmızı Örümcek Zararı",
    chemical: {
      activeIngredient: "Abamektin",
      exampleProducts: ["Vertimec", "Abamektin 1.8 EC"],
      doseLabel: "40-50 ml/dekar",
      doseMlPer100L: 40,
      applicationIntervalDays: 10,
      preHarvestIntervalDays: 3,
    },
    organic: {
      method: "Neem yağı + sabunlu su karışımı, yaprak altlarına yönelik püskürtme, nem artırma (misting)",
      effectivenessPercent: 60,
      applicationIntervalDays: 5,
    },
    biologicalControl: "Phytoseiulus persimilis (avcı akar) kırmızı örümceğin en etkili doğal düşmanıdır; sera üreticilerinden temin edilebilir.",
    safetyEquipment: ["Eldiven", "Maske", "Koruyucu gözlük", "Uzun kollu kıyafet"],
    mixingWarnings: ["Arı aktivitesi yüksek saatlerde uygulamayın (sabah erken/akşam tercih edin)"],
    wateringAdvice: "Nem oranını artırmak kırmızı örümcek popülasyonunu azaltır.",
    estimatedRecoveryDays: 10,
  },
  "Elma Karalekesi": {
    diseaseKeyTr: "Elma Karalekesi",
    chemical: {
      activeIngredient: "Kaptan",
      exampleProducts: ["Captan 50 WP"],
      doseLabel: "150-200 g/dekar",
      doseMlPer100L: 150,
      applicationIntervalDays: 10,
      preHarvestIntervalDays: 14,
    },
    organic: {
      method: "Bordo bulamacı (kış uygulaması), düşen yaprakların toplanıp uzaklaştırılması",
      effectivenessPercent: 45,
      applicationIntervalDays: 14,
    },
    biologicalControl: "Sonbaharda düşen yaprakların toplanıp kompostlanması, kışlayan spor miktarını doğal yoldan azaltır.",
    safetyEquipment: ["Eldiven", "Maske", "Koruyucu gözlük"],
    mixingWarnings: ["Yağ bazlı ürünlerle 2 hafta ara verin"],
    wateringAdvice: "Tepe sulamadan kaçının, kök bölgesine sulama yapın.",
    estimatedRecoveryDays: 21,
  },
  "Elma Kara Çürüklüğü": {
    diseaseKeyTr: "Elma Kara Çürüklüğü",
    chemical: {
      activeIngredient: "Tiofanat-metil",
      exampleProducts: ["Topsin M 70 WP"],
      doseLabel: "100-150 g/dekar",
      applicationIntervalDays: 14,
      preHarvestIntervalDays: 14,
    },
    organic: {
      method: "Ölü/hastalıklı dalların budanıp uzaklaştırılması, yara bakım macunu uygulaması",
      effectivenessPercent: 40,
      applicationIntervalDays: 14,
    },
    biologicalControl: "Budama sonrası açık yaraların temiz tutulması enfeksiyon riskini doğal yoldan azaltır.",
    safetyEquipment: ["Eldiven", "Maske", "Koruyucu gözlük"],
    mixingWarnings: [],
    wateringAdvice: "Ağaç tacı içi hava sirkülasyonunu artıracak budama yapın.",
    estimatedRecoveryDays: 30,
  },
  "Elma Pas Hastalığı": {
    diseaseKeyTr: "Elma Pas Hastalığı",
    chemical: {
      activeIngredient: "Miklobutanil",
      exampleProducts: ["Systhane 12E"],
      doseLabel: "50-75 ml/dekar",
      applicationIntervalDays: 14,
      preHarvestIntervalDays: 14,
    },
    organic: {
      method: "Yakın çevredeki ardıç (Juniperus) ağaçlarının uzaklaştırılması (alternatif konukçu), kükürt uygulaması",
      effectivenessPercent: 40,
      applicationIntervalDays: 14,
    },
    biologicalControl: "Bu hastalık ardıç ağaçlarıyla döngü halindedir; 500m çevredeki ardıçların kaldırılması en etkili doğal önlemdir.",
    safetyEquipment: ["Eldiven", "Maske"],
    mixingWarnings: [],
    wateringAdvice: "Tepe sulamadan kaçının.",
    estimatedRecoveryDays: 21,
  },
  "Üzüm Külleme": {
    diseaseKeyTr: "Üzüm Külleme",
    chemical: {
      activeIngredient: "Kükürt (Islanabilir)",
      exampleProducts: ["Kükürt 80 WP", "Thiovit Jet"],
      doseLabel: "300-400 g/dekar",
      doseMlPer100L: 300,
      applicationIntervalDays: 10,
      preHarvestIntervalDays: 7,
    },
    organic: {
      method: "Kükürt tozlama (organik sertifikalı), potasyum bikarbonat spreyi, sık budama ile hava sirkülasyonu",
      effectivenessPercent: 65,
      applicationIntervalDays: 10,
    },
    biologicalControl: "Ampelomyces quisqualis (küllemeyi parazitleyen bir mantar) biyofungisit formunda mevcuttur.",
    safetyEquipment: ["Eldiven", "Maske", "Koruyucu gözlük"],
    mixingWarnings: ["Sıcaklık 32°C üzerindeyken kükürt uygulamayın (yaprak yanığı riski)"],
    wateringAdvice: "Yaprak yüzeyini kuru tutun, damla sulama önerilir.",
    estimatedRecoveryDays: 14,
  },
  "Üzüm Kara Çürüklüğü": {
    diseaseKeyTr: "Üzüm Kara Çürüklüğü",
    chemical: {
      activeIngredient: "Mankozeb",
      exampleProducts: ["Dithane M-45"],
      doseLabel: "200-250 g/dekar",
      applicationIntervalDays: 10,
      preHarvestIntervalDays: 14,
    },
    organic: {
      method: "Mumyalaşmış meyvelerin toplanıp uzaklaştırılması, budama ile hava sirkülasyonu",
      effectivenessPercent: 40,
      applicationIntervalDays: 10,
    },
    biologicalControl: "Kışlayan mumyalaşmış meyvelerin bahçeden uzaklaştırılması enfeksiyon kaynağını doğal yoldan keser.",
    safetyEquipment: ["Eldiven", "Maske", "Koruyucu gözlük"],
    mixingWarnings: [],
    wateringAdvice: "Tepe sulamadan kaçının.",
    estimatedRecoveryDays: 21,
  },
  "Üzüm Esca (Kara Çiçek) Hastalığı": {
    diseaseKeyTr: "Üzüm Esca (Kara Çiçek) Hastalığı",
    chemical: {
      activeIngredient: "Etkili kimyasal tedavi sınırlıdır — koruyucu: Tiofanat-metil",
      exampleProducts: ["Topsin M 70 WP"],
      doseLabel: "150 g/dekar (koruyucu, kesim yaralarına)",
      applicationIntervalDays: 0,
      preHarvestIntervalDays: 14,
    },
    organic: {
      method: "Enfekte odun dokusunun budanarak uzaklaştırılması, budama yaralarının macunla kapatılması",
      effectivenessPercent: 30,
      applicationIntervalDays: 0,
    },
    biologicalControl: "Trichoderma bazlı budama yarası koruyucuları enfeksiyon riskini azaltabilir.",
    safetyEquipment: ["Eldiven", "Maske"],
    mixingWarnings: ["Bu bir odun hastalığıdır, yaprak spreyleri sınırlı etkilidir"],
    wateringAdvice: "Aşırı sulamadan kaçının, kök stresi hastalığı tetikleyebilir.",
    estimatedRecoveryDays: 60,
  },
  "Patates Erken Yanıklık": {
    diseaseKeyTr: "Patates Erken Yanıklık",
    chemical: {
      activeIngredient: "Klorotalonil",
      exampleProducts: ["Bravo 500 SC"],
      doseLabel: "150-200 ml/dekar",
      applicationIntervalDays: 10,
      preHarvestIntervalDays: 7,
    },
    organic: {
      method: "Dengeli gübreleme (aşırı azottan kaçının), rotasyon, bakır bazlı spreyler",
      effectivenessPercent: 50,
      applicationIntervalDays: 10,
    },
    biologicalControl: "3 yıllık patates-patlıcangil rotasyonu toprak kaynaklı inokulum baskısını azaltır.",
    safetyEquipment: ["Eldiven", "Maske", "Koruyucu gözlük"],
    mixingWarnings: [],
    wateringAdvice: "Damla sulama tercih edin.",
    estimatedRecoveryDays: 14,
  },
  "Patates Geç Yanıklık": {
    diseaseKeyTr: "Patates Geç Yanıklık",
    chemical: {
      activeIngredient: "Mankozeb + Metalaksil-M",
      exampleProducts: ["Ridomil Gold MZ"],
      doseLabel: "250-300 g/dekar",
      applicationIntervalDays: 7,
      preHarvestIntervalDays: 7,
    },
    organic: {
      method: "Bakır bazlı bordo bulamacı, hasat öncesi sap kesimi (yumru bulaşmasını önlemek için)",
      effectivenessPercent: 50,
      applicationIntervalDays: 7,
    },
    biologicalControl: "Hasattan 2 hafta önce sapların kesilip uzaklaştırılması, yumruya bulaşmayı doğal yoldan engeller.",
    safetyEquipment: ["Eldiven", "Maske (FFP2)", "Koruyucu gözlük"],
    mixingWarnings: ["Hızlı yayılan bir hastalıktır, ilk belirtide derhal müdahale edin"],
    wateringAdvice: "Damla sulama zorunlu, yağmurlamadan kaçının.",
    estimatedRecoveryDays: 10,
  },
  "Biber Bakteriyel Leke": {
    diseaseKeyTr: "Biber Bakteriyel Leke",
    chemical: {
      activeIngredient: "Bakır hidroksit",
      exampleProducts: ["Kocide 2000"],
      doseLabel: "200 g/dekar",
      applicationIntervalDays: 7,
      preHarvestIntervalDays: 5,
    },
    organic: {
      method: "Sertifikalı tohum kullanımı, tarlada sırayla çalışırken alet dezenfeksiyonu",
      effectivenessPercent: 40,
      applicationIntervalDays: 7,
    },
    biologicalControl: "Bakteriyel hastalıklarda önleme esastır; enfekte bitki artıklarının derin gömülmesi/uzaklaştırılması önerilir.",
    safetyEquipment: ["Eldiven", "Maske", "Koruyucu gözlük"],
    mixingWarnings: ["Islak yapraklarda çalışmayın, bakteri elle taşınabilir"],
    wateringAdvice: "Damla sulama zorunlu.",
    estimatedRecoveryDays: 16,
  },
  "Şeftali Bakteriyel Leke": {
    diseaseKeyTr: "Şeftali Bakteriyel Leke",
    chemical: {
      activeIngredient: "Bakır hidroksit (kış uygulaması)",
      exampleProducts: ["Kocide 2000"],
      doseLabel: "200-250 g/dekar",
      applicationIntervalDays: 14,
      preHarvestIntervalDays: 14,
    },
    organic: {
      method: "Dayanıklı çeşit seçimi, dengeli azot gübrelemesi, rüzgar kıran bariyerleri",
      effectivenessPercent: 35,
      applicationIntervalDays: 14,
    },
    biologicalControl: "Rüzgar kıran bitki bariyerleri, bakterinin rüzgarla taşınmasını doğal yoldan azaltır.",
    safetyEquipment: ["Eldiven", "Maske"],
    mixingWarnings: [],
    wateringAdvice: "Tepe sulamadan kaçının.",
    estimatedRecoveryDays: 25,
  },
  "Kiraz Külleme Hastalığı": {
    diseaseKeyTr: "Kiraz Külleme Hastalığı",
    chemical: {
      activeIngredient: "Kükürt / Miklobutanil",
      exampleProducts: ["Systhane 12E"],
      doseLabel: "50-75 ml/dekar",
      applicationIntervalDays: 14,
      preHarvestIntervalDays: 7,
    },
    organic: {
      method: "Budama ile hava sirkülasyonu, potasyum bikarbonat spreyi",
      effectivenessPercent: 50,
      applicationIntervalDays: 14,
    },
    biologicalControl: "Ampelomyces quisqualis bazlı biyofungisitler destekleyici olarak kullanılabilir.",
    safetyEquipment: ["Eldiven", "Maske"],
    mixingWarnings: ["32°C üzeri sıcaklıkta kükürt uygulamayın"],
    wateringAdvice: "Yaprak yüzeyini kuru tutun.",
    estimatedRecoveryDays: 14,
  },
  "Kabak Külleme Hastalığı": {
    diseaseKeyTr: "Kabak Külleme Hastalığı",
    chemical: {
      activeIngredient: "Kükürt / Azoksistrobin",
      exampleProducts: ["Kükürt 80 WP", "Amistar"],
      doseLabel: "250-300 g/dekar",
      applicationIntervalDays: 10,
      preHarvestIntervalDays: 3,
    },
    organic: {
      method: "Süt-su karışımı (1:9 oranı) haftalık sprey, dayanıklı çeşit seçimi",
      effectivenessPercent: 55,
      applicationIntervalDays: 7,
    },
    biologicalControl: "Bacillus subtilis bazlı biyofungisitler önleyici uygulamada etkilidir.",
    safetyEquipment: ["Eldiven", "Maske"],
    mixingWarnings: [],
    wateringAdvice: "Yaprak altına odaklı sulama yapın.",
    estimatedRecoveryDays: 10,
  },
  "Çilek Yaprak Yanıklığı": {
    diseaseKeyTr: "Çilek Yaprak Yanıklığı",
    chemical: {
      activeIngredient: "Kaptan",
      exampleProducts: ["Captan 50 WP"],
      doseLabel: "150-200 g/dekar",
      applicationIntervalDays: 10,
      preHarvestIntervalDays: 5,
    },
    organic: {
      method: "Eski/hastalıklı yaprakların temizlenmesi, malçlama, aralıklı dikim",
      effectivenessPercent: 45,
      applicationIntervalDays: 10,
    },
    biologicalControl: "Hasat sonrası yaprak temizliği (renovasyon), sonraki sezon inokulum baskısını azaltır.",
    safetyEquipment: ["Eldiven", "Maske"],
    mixingWarnings: [],
    wateringAdvice: "Damla sulama önerilir.",
    estimatedRecoveryDays: 12,
  },
  "Mısır Gri Yaprak Lekesi": {
    diseaseKeyTr: "Mısır Gri Yaprak Lekesi",
    chemical: {
      activeIngredient: "Azoksistrobin + Propikonazol",
      exampleProducts: ["Amistar Xtra"],
      doseLabel: "75-100 ml/dekar",
      applicationIntervalDays: 14,
      preHarvestIntervalDays: 14,
    },
    organic: {
      method: "Anız yönetimi (toprak yüzeyine bırakılmaması), dayanıklı çeşit seçimi, rotasyon",
      effectivenessPercent: 35,
      applicationIntervalDays: 14,
    },
    biologicalControl: "Hasat sonrası anızın toprağa karıştırılması, kışlayan inokulumu doğal yoldan azaltır.",
    safetyEquipment: ["Eldiven", "Maske", "Koruyucu gözlük"],
    mixingWarnings: [],
    wateringAdvice: "Sulama hastalık baskısını doğrudan etkilemez, nem yönetimi önemlidir.",
    estimatedRecoveryDays: 21,
  },
  "Mısır Pas Hastalığı": {
    diseaseKeyTr: "Mısır Pas Hastalığı",
    chemical: {
      activeIngredient: "Propikonazol",
      exampleProducts: ["Tilt 250 EC"],
      doseLabel: "50-75 ml/dekar",
      applicationIntervalDays: 14,
      preHarvestIntervalDays: 14,
    },
    organic: {
      method: "Dayanıklı çeşit kullanımı, erken ekim",
      effectivenessPercent: 30,
      applicationIntervalDays: 14,
    },
    biologicalControl: "Doğal düşman baskısı sınırlıdır; dayanıklı çeşit seçimi en etkili yöntemdir.",
    safetyEquipment: ["Eldiven", "Maske"],
    mixingWarnings: [],
    wateringAdvice: "Sulama doğrudan etkili değildir.",
    estimatedRecoveryDays: 18,
  },
  "Mısır Kuzey Yaprak Yanıklığı": {
    diseaseKeyTr: "Mısır Kuzey Yaprak Yanıklığı",
    chemical: {
      activeIngredient: "Azoksistrobin",
      exampleProducts: ["Amistar"],
      doseLabel: "80-100 ml/dekar",
      applicationIntervalDays: 14,
      preHarvestIntervalDays: 14,
    },
    organic: {
      method: "Rotasyon, anız yönetimi, dayanıklı çeşit",
      effectivenessPercent: 35,
      applicationIntervalDays: 14,
    },
    biologicalControl: "Anızın toprağa karıştırılması kışlayan spor miktarını azaltır.",
    safetyEquipment: ["Eldiven", "Maske"],
    mixingWarnings: [],
    wateringAdvice: "Nem yönetimi önemlidir.",
    estimatedRecoveryDays: 21,
  },
  "Turunçgil Yeşillenme Hastalığı (HLB)": {
    diseaseKeyTr: "Turunçgil Yeşillenme Hastalığı (HLB)",
    chemical: {
      activeIngredient: "Doğrudan tedavi yok — vektör (turunçgil pisillidi) kontrolü: İmidakloprid",
      exampleProducts: ["Confidor"],
      doseLabel: "Ağaç başına ürün etiketine göre",
      applicationIntervalDays: 30,
      preHarvestIntervalDays: 21,
    },
    organic: {
      method: "Enfekte ağaçların derhal sökülmesi (yayılmayı önlemek için tek etkili yöntem), sertifikalı fidan kullanımı",
      effectivenessPercent: 15,
      applicationIntervalDays: 0,
    },
    biologicalControl: "Tamarixia radiata (parazitoit arı) turunçgil pisillidi popülasyonunu baskılayabilir, ancak hastalığı tedavi etmez.",
    safetyEquipment: ["Eldiven", "Maske"],
    mixingWarnings: ["HLB tedavisi yoktur — bu ciddi bir karantina hastalığıdır, yerel tarım müdürlüğüne bildirim zorunludur"],
    wateringAdvice: "Sulama hastalığı etkilemez.",
    estimatedRecoveryDays: 0,
  },
};

export const GENERIC_TREATMENT: TreatmentInfo = {
  diseaseKeyTr: "Genel",
  chemical: {
    activeIngredient: "Geniş spektrumlu fungisit (spesifik ürün için AI Sohbet Asistanına danışın)",
    exampleProducts: ["Yerel tarım danışmanınızın önerdiği ürün"],
    doseLabel: "Ürün etiketindeki dozu uygulayın",
    applicationIntervalDays: 7,
    preHarvestIntervalDays: 7,
  },
  organic: {
    method: "Etkilenen yaprakların uzaklaştırılması, hava sirkülasyonunun artırılması, aşırı sulamadan kaçınma",
    effectivenessPercent: 40,
    applicationIntervalDays: 7,
  },
  biologicalControl: "Genel biyolojik mücadele için AI Sohbet Asistanına spesifik zararlı/hastalık adını sorabilirsin.",
  safetyEquipment: ["Eldiven", "Maske", "Koruyucu gözlük"],
  mixingWarnings: ["Farklı kimyasalları karıştırmadan önce etiket uyumluluğunu kontrol edin"],
  wateringAdvice: "Yaprakları ıslatmadan, kök bölgesine sulama yapın.",
  estimatedRecoveryDays: 14,
};

export function getLocalTreatment(diseaseNameTr: string): TreatmentInfo | null {
  return TREATMENT_DB[diseaseNameTr] ?? null;
}

export function getTreatment(diseaseNameTr: string): TreatmentInfo {
  return TREATMENT_DB[diseaseNameTr] ?? { ...GENERIC_TREATMENT, diseaseKeyTr: diseaseNameTr };
}

/** Dekar bazlı dozu, girilen tarla/saksı alanına göre ölçekler. */
export function scaleDose(doseLabel: string, fieldSizeDa: number): string {
  const match = doseLabel.match(/(\d+)(?:-(\d+))?\s*(g|ml)\/dekar/);
  if (!match) return doseLabel;
  const low = Number(match[1]);
  const high = match[2] ? Number(match[2]) : low;
  const unit = match[3];
  const avg = (low + high) / 2;
  const scaled = Math.round(avg * fieldSizeDa);
  return `${scaled} ${unit} (${fieldSizeDa} dekar için)`;
}
