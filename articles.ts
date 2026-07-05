export interface Article {
  id: string;
  title: string;
  category: "Bitki" | "Hastalık" | "Zararlı" | "Gübre" | "Organik" | "SSS";
  tags: string[];
  readMinutes: number;
  content: string; // markdown-benzeri düz metin, ## alt başlık kullanılabilir
}

export const ARTICLES: Article[] = [
  {
    id: "domates-yetistirme",
    title: "Domates Yetiştirme Rehberi: Tohumdan Hasada",
    category: "Bitki",
    tags: ["domates", "yetiştirme", "başlangıç"],
    readMinutes: 6,
    content: `## Toprak ve İklim İsteği
Domates, iyi drene olan, organik madde bakımından zengin ve pH'ı 6.0-6.8 arasında olan toprakları sever. Don olaylarına karşı çok hassastır; toprak sıcaklığı en az 15°C'ye ulaşmadan fide dikimi yapılmamalıdır.

## Dikim
Fideler 20-25 cm boya ulaştığında, sıra arası 70-90 cm, sıra üzeri 40-50 cm olacak şekilde dikilir. Dikim sonrası bol su verilmeli ve fideler birkaç gün gölgelendirilmelidir.

## Sulama
Domates düzenli ve dengeli sulama ister. Aşırı sulama kök çürüklüğüne, yetersiz sulama ise çiçek ucu çürüklüğüne (kalsiyum eksikliği belirtisi) yol açar. Damla sulama, yaprakları ıslatmadığı için hastalık riskini azaltır.

## Destekleme ve Budama
Sırık domateslerde yan sürgünlerin (koltuk) düzenli alınması, bitkinin enerjisini meyveye yönlendirir. Bitkiler kazık veya file ile desteklenmelidir.

## Gübreleme
Dikimde fosforlu, gelişme döneminde dengeli NPK, meyve tutumundan sonra potasyum ağırlıklı gübreleme önerilir. Aşırı azot, yaprak gelişimini artırırken meyve tutumunu geciktirir.

## Hasat
Meyveler kırmızı-turuncu renge döndüğünde, sapından hafifçe çevrilerek koparılır. Uzun mesafe taşınacaksa pembe dönem hasadı tercih edilebilir.`,
  },
  {
    id: "gec-yaniklik",
    title: "Geç Yanıklık (Phytophthora infestans): Tanıma ve Mücadele",
    category: "Hastalık",
    tags: ["geç-yanıklık", "domates", "patates", "mantar"],
    readMinutes: 5,
    content: `## Hastalık Etmeni
Geç yanıklık, Phytophthora infestans adlı bir su küfü (oomycete) tarafından oluşturulur. Domates ve patatesin en yıkıcı hastalıklarından biridir; 1840'lardaki İrlanda Patates Kıtlığı'nın sebebidir.

## Belirtiler
Yapraklarda düzensiz, koyu yeşil-kahverengi, suya doygun lekeler oluşur. Nemli havalarda lekelerin alt yüzeyinde beyazımsı bir küf tabakası görülür. Hastalık hızla yayılarak tüm yaprağı ve gövdeyi kurutabilir. Meyvelerde sert, kahverengi lekeler oluşur.

## Yayılma Koşulları
Serin (10-20°C) ve nemli (>%90 nem) hava koşulları hastalığın en hızlı yayıldığı ortamdır. Sporlar rüzgar ve su sıçramasıyla taşınır; birkaç gün içinde tüm bir tarlayı etkileyebilir.

## Mücadele Yöntemleri
- Dayanıklı çeşitler tercih edin.
- Bitki sıklığını azaltarak hava sirkülasyonunu artırın.
- Yaprakları ıslatmayan damla sulama kullanın.
- İlk belirtide bakır bazlı (organik) veya mankozeb/metalaksil içeren (kimyasal) fungisit uygulayın.
- Hastalıklı bitki artıklarını tarladan uzaklaştırıp yakın; kompostlamayın.

## Önleme
Rotasyon (aynı tarlaya art arda domates/patates ekmemek) ve sertifikalı, hastalıksız tohum/fide kullanımı en etkili önleme yöntemleridir.`,
  },
  {
    id: "kirmizi-orumcek",
    title: "Kırmızı Örümcek (Tetranychus urticae) ile Mücadele",
    category: "Zararlı",
    tags: ["kırmızı-örümcek", "zararlı", "organik"],
    readMinutes: 4,
    content: `## Tanıma
Kırmızı örümcek (iki noktalı kırmızı örümcek), 0.5 mm büyüklüğünde, çıplak gözle zor seçilen bir akar türüdür. Yaprak altlarında ince örümcek ağları ve yapraklarda benekli sararma bırakır. Sıcak ve kuru havalarda popülasyonu patlama şeklinde artar.

## Zarar Şekli
Bitki özsuyunu emerek yapraklarda beneklenme, sararma ve dökülmeye neden olur. Şiddetli enfestasyonlarda bitki büyümesi ciddi şekilde yavaşlar.

## Kültürel Mücadele
- Bitkiler arası nem oranını artırın (misting/yaprak spreyi) — kırmızı örümcek kuru ortamı sever.
- Aşırı azotlu gübrelemeden kaçının, yumuşak doku zararlıyı çeker.
- Tozlu ortamlardan kaçının; yaprakları düzenli su ile durulamak popülasyonu azaltır.

## Organik Mücadele
Neem yağı (%0.5-1) ve potasyum sabunu karışımı, yaprak altlarına haftalık uygulanarak etkili sonuç verir. Faydalı böcekler (Phytoseiulus persimilis gibi avcı akarlar) biyolojik mücadelede kullanılabilir.

## Kimyasal Mücadele
Abamektin veya hexythiazox etken maddeli akarisitler kullanılabilir. Aynı etken maddeyi art arda kullanmak direnç gelişimine yol açar; rotasyon önemlidir.`,
  },
  {
    id: "organik-gubre",
    title: "Organik Gübre Türleri ve Doğru Kullanımı",
    category: "Gübre",
    tags: ["organik", "gübre", "kompost"],
    readMinutes: 5,
    content: `## Kompost
Bitkisel/hayvansal atıkların çürütülmesiyle elde edilir. Toprağın organik madde içeriğini, su tutma kapasitesini ve mikrobiyal aktiviteyi artırır. Dikimden 2-3 hafta önce toprağa karıştırılmalıdır; taze/olgunlaşmamış kompost kök yanığına neden olabilir.

## Solucan Gübresi (Vermikompost)
Besin elementleri bakımından zengin, hızlı etkili bir organik gübredir. Fide döneminde bile güvenle kullanılabilir; %10-20 oranında toprakla karıştırılması önerilir.

## Çiftlik Gübresi
İyi yanmış (en az 6 ay bekletilmiş) çiftlik gübresi kullanılmalıdır. Taze gübre hem yüksek azot içeriğiyle kök yanığı yapar hem de patojen/yabani ot tohumu taşıma riski taşır.

## Yeşil Gübre
Baklagil bitkileri (fiğ, bakla) toprağa ekilip çiçeklenme öncesi toprağa karıştırılarak azot fiksasyonundan yararlanılır. Özellikle sonbahar-kış nadasında etkilidir.

## Deniz Yosunu Ekstraktı
Makro besin elementinden çok, bitkinin stres direncini artıran hormon benzeri bileşikler (sitokinin, oksin) içerir. Yaprak gübresi olarak seyreltilerek uygulanır.

## Kullanım Sıklığı
Genel kural: kompost/solucan gübresi her 4-6 haftada bir, deniz yosunu ekstraktı gibi biyostimülanlar her 2 haftada bir uygulanabilir. Aşırı gübreleme, tuzluluk stresine ve kök zararına yol açabileceğinden toprak testi yaptırmak en sağlıklısıdır.`,
  },
  {
    id: "uzum-kulleme",
    title: "Üzümde Külleme Hastalığı (Erysiphe necator)",
    category: "Hastalık",
    tags: ["üzüm", "külleme", "bağcılık"],
    readMinutes: 4,
    content: `## Hastalık Etmeni ve Belirtileri
Külleme, Erysiphe necator adlı bir mantar tarafından oluşur. Yaprak, sürgün ve salkımlarda beyaz-gri, unumsu bir tabaka şeklinde görülür. Şiddetli enfeksiyonlarda taneler çatlar ve gelişimi durur.

## Uygun Koşullar
Külleme, geç yanıklığın aksine nemli değil, ılık (20-27°C) ve gölgeli koşulları sever. Sık dikim ve zayıf hava sirkülasyonu hastalığı tetikler.

## Mücadele
- Kükürt (organik sertifikalı dahil), en klasik ve etkili mücadele yöntemidir; 30°C üzerindeki sıcaklıklarda yaprak yanığı riski taşıdığından sıcak günlerde uygulanmamalıdır.
- Potasyum bikarbonat spreyleri organik alternatif olarak kullanılabilir.
- Budama ile omca içi hava sirkülasyonunu artırmak önleyicidir.
- Kimyasal mücadelede triazol grubu fungisitler (myclobutanil vb.) etkilidir; etiket talimatlarına uyulmalıdır.

## Zamanlama
İlk uygulama sürgünler 10-15 cm olduğunda başlamalı, çiçeklenme ve tane tutumu dönemlerinde yoğunlaştırılmalıdır.`,
  },
  {
    id: "organik-bakim",
    title: "Kimyasalsız Bahçe: Organik Bakımın Temelleri",
    category: "Organik",
    tags: ["organik", "sürdürülebilir", "bahçe"],
    readMinutes: 6,
    content: `## Toprak Sağlığı Önce Gelir
Organik bahçeciliğin temeli sağlıklı topraktır. Düzenli kompost ilavesi, örtü bitkileri ve toprağı az kazma (no-dig) yaklaşımı mikrobiyal yaşamı korur.

## Doğal Zararlı Kontrolü
- Companion planting (yandaş bitkilendirme): Fesleğen domatesle, tagetes (kadife çiçeği) birçok bitkiyle iyi uyum sağlar ve zararlıları uzaklaştırır.
- Faydalı böcekleri (uğur böceği, kızböcekleri) çekmek için çiçekli bitkiler ekleyin.
- Tuzak bitkiler (zararlıları asıl üründen uzaklaştıran bitkiler) kullanın.

## Doğal Hastalık Önleme
Bitkiler arası mesafeyi koruyarak hava sirkülasyonunu artırmak, çoğu mantar hastalığının en etkili önlemesidir. Sabah sulaması, yaprakların gün içinde kurumasını sağlar.

## Rotasyon
Aynı familyadan bitkileri (domates-patates-biber gibi patlıcangiller) aynı yere art arda ekmemek, toprak kaynaklı hastalık ve zararlı birikimini engeller. 3-4 yıllık rotasyon önerilir.

## Doğal Gübreleme Döngüsü
Mutfak atıklarından kompost, bahçe artıklarından yeşil gübre ve baklagil ekimi ile dışarıdan girdi ihtiyacı minimize edilebilir.`,
  },
  {
    id: "sulama-sss",
    title: "Sulama Hakkında Sıkça Sorulan Sorular",
    category: "SSS",
    tags: ["sulama", "sss"],
    readMinutes: 4,
    content: `## Ne sıklıkla sulamalıyım?
Kesin bir sayı vermek yanıltıcıdır; toprak tipi, bitki türü ve hava koşulu belirleyicidir. Genel kural: parmağınızı toprağa 2-3 cm sokun, kuruysa sulayın.

## Sabah mı akşam mı sulamalıyım?
Sabah erken saatler en idealidir. Bitkinin gün boyu ihtiyacı olan suyu alır ve yapraklar gün içinde kurur (mantar riski azalır). Akşam sulaması, yaprakların gece boyu nemli kalmasına ve hastalık riskinin artmasına yol açabilir.

## Damla sulama mı, yağmurlama mı?
Damla sulama su verimliliği ve hastalık riskini azaltma açısından üstündür çünkü yaprakları ıslatmaz. Yağmurlama, geniş alanlarda daha pratik olabilir ama mantar hastalıkları için risk taşır.

## Aşırı sulamanın belirtileri nelerdir?
Yaprak sararması (özellikle alt yapraklarda), yumuşak/kararan kökler, toprak yüzeyinde yosun oluşumu aşırı sulama belirtileridir. Kök çürüklüğüne yol açabilir.

## Kuraklık stresinin belirtileri nelerdir?
Solgunluk (özellikle öğle sıcağında), yaprak kenarlarında kavrulma, erken yaprak dökümü kuraklık stresinin işaretleridir.

## Saksı bitkileri toprak bitkilerinden daha mı sık sulanmalı?
Evet, saksılar daha hızlı kurur çünkü kök hacmi ve toprak miktarı sınırlıdır. Saksı büyüklüğüne ve materyaline göre günlük kontrol önerilir.`,
  },
  {
    id: "toprak-ph-yonetimi",
    title: "Toprak pH Yönetimi: Bitkileriniz İçin Doğru Denge",
    category: "Bitki",
    tags: ["toprak", "ph", "besin-eksikliği"],
    readMinutes: 5,
    content: `## pH Neden Önemli?
Toprak pH'ı, bitkilerin besin elementlerini alabilme kapasitesini doğrudan etkiler. Çoğu bitki 6.0-7.0
(hafif asidik-nötr) aralığını sever. pH çok düşük (asidik) veya çok yüksek (alkalin) olduğunda, toprakta
besin elementi mevcut olsa bile bitki onu alamaz — bu duruma "besin kilitlenmesi" denir.

## Belirtiler
Demir eksikliği (yapraklarda damarlar yeşil, aralar sarı — klorozis) genellikle alkalin (yüksek pH)
topraklarda görülür. Alüminyum toksisitesi ve fosfor eksikliği ise aşırı asidik topraklarda yaygındır.

## Nasıl Ölçülür?
Ucuz pH test kitleri veya dijital pH metrelerle evde ölçüm yapılabilir. Daha kesin sonuç için toprak
numunesi tarım il/ilçe müdürlüğü laboratuvarlarına gönderilebilir.

## Düzeltme Yöntemleri
- **Asidik toprağı yükseltmek için**: Kireç (kalsiyum karbonat) uygulaması.
- **Alkalin toprağı düşürmek için**: Elemental kükürt veya organik madde (kompost, çam kabuğu) ilavesi.
- Değişiklikler yavaş gerçekleşir; uygulamadan 2-3 ay sonra tekrar test edilmesi önerilir.

## Bitkiye Özel Tercihler
Yaban mersini, azalea gibi bitkiler asidik toprak (pH 4.5-5.5) severken, çoğu sebze ve çim türü nötre
yakın pH'ı tercih eder. Ekim öncesi hedef bitkinin pH ihtiyacını araştırmak, sorunları baştan önler.`,
  },
  {
    id: "zeytin-agaci-bakimi",
    title: "Zeytin Ağacı Bakımı: Budama, Sulama ve Hastalıklar",
    category: "Bitki",
    tags: ["zeytin", "ağaç", "budama"],
    readMinutes: 5,
    content: `## Sulama İhtiyacı
Zeytin kuraklığa dayanıklı bir ağaçtır ama verimli meyve için düzenli sulama gerekir, özellikle çiçeklenme
(Mayıs) ve tane irileşme (Temmuz-Ağustos) dönemlerinde. Genç ağaçlar (1-3 yaş) haftada bir, olgun ağaçlar
15 günde bir derin sulanabilir.

## Budama
Zeytin, açık merkez (vazo) formunda budanır — ağacın içine güneş ışığı girmesi verim ve hastalık direnci
için kritiktir. Kış sonu/erken ilkbahar (don riski geçtikten sonra) budama için en uygun zamandır. Kuru,
hastalıklı ve birbirine sürtünen dallar çıkarılmalıdır.

## Yaygın Hastalıklar
**Zeytin Halkalı Lekesi (Peacock Spot)**: Yapraklarda halka şeklinde koyu lekeler, nemli kış aylarında
yaygın. Bakır bazlı fungisitlerle (sonbahar ve ilkbahar) kontrol edilir.
**Zeytin Sineği (Bactrocera oleae)**: Meyveye yumurta bırakarak zarar verir. Tuzak (feromon/renk tuzağı)
ile izleme, gerekirse spinosad bazlı yem tuzaklamasıyla mücadele edilir.

## Gübreleme
İlkbaharda azotlu, sonbaharda potasyum ağırlıklı gübreleme önerilir. Yaprak analizi yapılarak eksik
mikro elementler (özellikle bor) belirlenip düzeltilebilir.

## Hasat
Zeytinler yeşilden mora döndüğü dönemde (Ekim-Kasım, çeşide göre değişir) hasat edilir. Sofralık için
erken, yağlık için biraz daha geç hasat tercih edilir.`,
  },
  {
    id: "seracilikta-iklim-kontrolu",
    title: "Seracılıkta İklim Kontrolü: Sıcaklık, Nem ve Havalandırma",
    category: "Bitki",
    tags: ["sera", "iklim", "havalandırma"],
    readMinutes: 5,
    content: `## Sıcaklık Yönetimi
Çoğu sebze türü için gündüz 22-26°C, gece 15-18°C ideal aralıktır. Aşırı sıcaklık (>32°C) çiçek dökümüne,
düşük sıcaklık (<10°C) ise gelişme durmasına yol açar. Otomatik havalandırma pencereleri veya fan-pad
soğutma sistemleri sıcaklığı dengeler.

## Nem Yönetimi
Bağıl nem %60-80 aralığında tutulmalıdır. Çok düşük nem (kuru hava) bitkilerde su stresine, çok yüksek
nem (>%85) ise mantar hastalıkları (külleme, botrytis) riskini ciddi şekilde artırır. Sabah erken
havalandırma, gece boyu biriken nemi tahliye eder.

## Havalandırma Stratejisi
Yan ve tepe havalandırma pencerelerinin birlikte kullanılması "baca etkisi" yaratarak pasif hava
sirkülasyonu sağlar. Rüzgarlı günlerde havalandırma kademeli açılmalı, ani sıcaklık düşüşünden
kaçınılmalıdır.

## CO2 Zenginleştirme
Ticari seralarda CO2 seviyesinin 800-1000 ppm'e çıkarılması fotosentezi ve verimi artırabilir, ancak
havalandırma açıkken bu etkisiz kalır — kapalı sera koşullarında uygulanmalıdır.

## Yaygın Sorunlar
Yetersiz havalandırma sonucu oluşan durgun hava, hem hastalık riskini artırır hem de tozlaşmayı
zorlaştırır (özellikle domates gibi rüzgar/titreşimle tozlaşan türlerde). Periyodik yaprak
titreştirme veya bombus arısı kullanımı bu sorunu azaltır.`,
  },
];
