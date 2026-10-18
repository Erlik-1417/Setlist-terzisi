# Setlist Terzisi

[Türkçe](#türkçe) · [English](#english)

## Türkçe

Canlı sahne grupları için süre, mola, enerji ve vokal yüküne göre repertuvar planlama aracı. Tasarım dili üst klasördeki `design.md` dosyasını izler. İlk sürüm yerel kullanım içindir.

## Çalıştır

Python 3.10+ gerekir; Python/Node paketi kurulmaz.

```powershell
Set-Location "klonladigin-proje-klasoru"
python server.py
```

Tarayıcı: http://127.0.0.1:8000

## Gerçek açık model bağlantısı

Uygulama Ollama'nın yerel `/api/chat` endpoint'ini kullanır. Önce [Ollama](https://ollama.com) kurup çalıştırın ve cihazınıza uygun açık ağırlıklı bir model indirin. Örneğin:

```powershell
ollama pull qwen2.5:3b
```

Arayüzde **Yenile → Açık model · Ollama → model seç → Setimi oluştur** adımlarını izleyin. İndirme boyutu ve hız cihazınıza bağlıdır. Model seçimi ve lisansını yarışma gönderisinde belirtin. Ollama kurulumu / model indirme bu proje tarafından otomatik yapılmaz.

AI, kullanıcı repertuvarındaki şarkıları etkinlik ve enerji tercihlerine göre sıralar ve seçilen arayüz dilinde gerekçe üretir. Her şarkı için kısa bir numara ve zorunlu sıra puanı içeren JSON şeması kullanılır. Eşit puanlar repertuvar sırasıyla çözülür; tüm şarkı kimlikleri kodla eksiksiz geri eşlenir ve sunucuda/istemcide doğrulanır. Geçersiz model yanıtı bir kez düzeltme istemiyle yeniden denenir. Süreye sığdırma, setlere ayırma, mola hesabı ve vokal koruma deterministik kodda yapılır. Sığmayan şarkılar gösterilir. Model yanıtı başarısızsa AI üretildiği söylenmez; mevcut önizleme korunur ve hata gösterilir.

**Yerleşik planlayıcı AI kullanmaz.** Ollama yokken ürünü denemek için kullanılabilir, ancak tek başına yarışmanın açık AI koşulunu karşılayan bir demo sayılmamalıdır. Teslimden önce gerçek modelle uçtan uca demo kaydedin.

Varsayılan Ollama adresi `http://127.0.0.1:11434`. İsteğe bağlı `OLLAMA_URL` sunucu ortam değişkeniyle değiştirilir; uzak adres seçilirse veriler o adrese gönderilir. Varsayılan durumda repertuvar yerel makinede işlenir. Web fontu için Google Fonts isteği yapılır; internet yoksa sistem fontuna düşer. Repertuvar ve ayarlar tarayıcının localStorage alanında saklanır; üretilen plan sayfa yenilendiğinde yerleşik önizleme olarak yeniden hesaplanır.

## Kullanım ve sınırlar

- Üst menüdeki TR / EN seçimi arayüzü, uyarıları, formları ve çıktıları değiştirir; dil tercihi bu tarayıcıda saklanır. Yeni AI isteklerinde model açıklaması seçilen dilde istenir. Önceden üretilen AI açıklaması otomatik çevrilmez; dil değişince yeniden üretme hatırlatması gösterilir.
- İlk güncellemede mevcut repertuvar korunarak 16 İngilizce örnek şarkı eklenir. Wonderwall, Yellow, Perfect, Stand by Me, Riptide, Valerie, Get Lucky, Uptown Funk, Blinding Lights ve Flowers dahildir. Repertuvardaki “İngilizce parçaları ekle” düğmesi eksik örnekleri tekrar ekleyebilir; aynı ad/sanatçıya sahip kayıtları çoğaltmaz. 100 şarkı sınırı geçilmez.
- Arayüz yazıları ve sayılar Inter kullanır. Süreler ve sayılarda sütun hizası için eşit genişlikli rakam özelliği etkinleştirilir.

- Örnek şarkı süreleri, tonlar, enerji ve vokal yükleri temsili kullanıcı verileridir; orijinal kayıtların doğrulanmış analizi değildir. Kendi yorumunuza göre düzenleyin.
- Molalar toplam süreye dahildir. Setler eşit süre bütçesi alır; şarkı bölünmez. Sığmayan süre, sahne geçişi/konuşma payı olarak görünür; bitiş saati yalnızca müzik ve molaları içerir.
- Enerji akışı sezgiseldir, müzikal kalite garantisi değildir. Vokal koruma mümkünse zor şarkıları ayırır; kaçınılmaz çakışmalar uyarılır.
- Tonlar bilgi amaçlıdır; armonik geçiş veya ses analizi yapılmaz. Şarkı sesi/sözleri alınmaz.
- Şarkı ekleme, düzenleme, silme, seçme, arama, set içinde yukarı/aşağı taşıma, metin dışa aktarma ve tarayıcıdan PDF yazdırma desteklenir.
- En fazla 100 şarkı, 5 set ve 480 dakika. Kimlik doğrulama, ödeme, bulut dağıtım ve setler arası elle taşıma henüz yok.

## Testler

```powershell
node --test tests/*.test.js
python -m unittest discover -s tests -p "test_*.py"
```

## Ticari hipotez

Haftada birden fazla sahneye çıkan gruplar için yeniden kullanılabilir repertuvar ve program üretimi. İleride grup başına abonelik veya etkinlik başına ücret denenebilir; ödeme isteği henüz kullanıcılarla doğrulanmadı.

## Yarışma teslimi

Çalışan açık model demosu, kaynak kodu, kullanım adımları ve hedef müşteriyi anlatan DEV yazısı hazırlayın. Bu depo otomatik olarak yayımlanmaz veya yarışmaya gönderilmez.

## English

Setlist Terzisi helps live bands turn their repertoire into a performance plan based on show duration, breaks, energy flow and vocal effort. It includes a Turkish/English interface, 16 Turkish and 16 English sample songs, and optional local open-weight AI through Ollama.

### Run locally

Requires Python 3.10 or newer. No Python or Node packages need to be installed. Run the following commands from the project directory containing `server.py`:

```powershell
python server.py
```

Open [http://127.0.0.1:8000](http://127.0.0.1:8000) in your browser. The server listens only on this computer. Set the `PORT` environment variable before starting the server to change the port.

### Connect an open-weight model

Install and start [Ollama](https://ollama.com), then download a model suitable for your hardware. For example:

```powershell
ollama pull qwen2.5:3b
```

In the app, choose **EN · English → Refresh → Open-weight model · Ollama → select your model → Build my set**. Model downloads and installation are not performed automatically. Download size and generation speed depend on the chosen model and hardware. Check the model's own license before distributing it or using it commercially; the application’s MIT license does not replace a model license.

The model receives your selected repertoire and show preferences, assigns a rank to each numbered song, and provides a short explanation in the selected interface language. A JSON schema requires a rank for every song. Equal ranks preserve repertoire order. The server maps the ranks back to the original song IDs and validates that no song was invented, omitted or duplicated. Invalid output receives one correction attempt.

Application code then fits songs into sets, calculates breaks and timings, and separates demanding vocals where possible. Unused songs and unavoidable vocal conflicts are shown. If AI generation fails, the app keeps the current preview and displays the error.

**The built-in planner does not use AI.** It lets you try the app without a local model. For a competition entry requiring open-source AI or open-weight models, demonstrate an actual model-assisted run rather than only the built-in planner.

### Features

- Add, edit, delete, select and search songs.
- Plan up to 5 sets within a total show duration of 10–480 minutes, including breaks.
- Choose a rising, wave-shaped or consistently high energy flow.
- Space out demanding vocals where the selected songs allow it.
- Move songs up or down within a set.
- Export a text setlist or use the browser print dialog to save a PDF.
- Switch between Turkish and English; the language preference is saved in this browser.
- Add the English sample pack without replacing your existing repertoire or duplicating matching song/artist entries.
- Use an Inter interface with tabular numerals for aligned timings.

### Data and privacy

Repertoire and show settings are stored in the browser’s localStorage. Generated plans are not persisted: reloading recalculates a built-in preview. Switching languages does not translate an existing AI explanation; build a new AI plan to request notes in the new language.

Ollama defaults to `http://127.0.0.1:11434`; model processing stays on your computer with that configuration. The optional server environment variable `OLLAMA_URL` can point to a different endpoint. If you choose a remote endpoint, the repertoire is sent there. The app requests its web font from Google Fonts and falls back to a system font when unavailable. Song audio and lyrics are not collected.

### Limitations

- Sample durations, musical keys, energy and vocal effort are editable performance estimates, not verified analyses of original recordings.
- Set budgets are equal. Songs are never split to fill a budget. Unallocated time is shown as room for transitions or banter; it is not included in the displayed finish time.
- Energy planning is heuristic. Model explanations can be inaccurate; review the final set before performing.
- Keys are displayed for reference. The app does not analyze harmonic transitions or audio.
- Maximum repertoire size: 100 songs. The sample pack is automatically added once when it fits within that limit.
- Authentication, payments, hosted deployment and manual movement between sets are not included.

### Tests

Node.js is needed only to run the JavaScript tests; it is not required to run the app.

```powershell
node --test tests/*.test.js
python -m unittest discover -s tests -p "test_*.py"
```

Tests cover timing budgets, song accounting, midnight rollover, vocal spacing, invalid model output, correction retries, language switching, translation placeholders and the English sample data. Mock-based tests do not measure model quality; validate your installed model with a real generation in the app.

### Business idea

The intended users are bands and musicians who perform multiple shows each week and reuse a changing repertoire. A future product could charge per band or per event for reusable planning workflows. Willingness to pay has not yet been validated with customers.

### Competition submission

Prepare a working open-weight model demo, source code, setup instructions and a DEV post explaining the intended customer and the role of open innovation. This repository does not automatically publish a post or submit an entry.

### License

Application source code is available under the [MIT License](LICENSE). Model licenses and font licenses apply separately.
