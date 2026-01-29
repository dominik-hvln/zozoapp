'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

export default function RegulaminPage() {
    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <Link href="/panel/ustawienia/informacje">
                    <Button variant="ghost" size="icon">
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <h2 className="text-xl font-semibold">Wróć</h2>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>REGULAMIN SKLEPU INTERNETOWEGO www.niezgubdziecka.pl</CardTitle>
                </CardHeader>
                <CardContent className="prose dark:prose-invert max-w-none text-sm space-y-6">
                    <section>
                        <h3 className="text-lg font-semibold">I. POSTANOWIENIA OGÓLNE</h3>
                        <div className="space-y-2">
                            <p>1. Regulamin określa wszystkie istotne kwestie dotyczące korzystania z platformy internetowej. Niniejszy Regulamin skierowany jest zarówno do Konsumentów, jak i do Przedsiębiorców korzystających ze Sklepu oraz określa zasady korzystania ze Sklepu internetowego oraz zasady i tryb zawierania Umów Sprzedaży z Klientem na odległość za pośrednictwem Sklepu.</p>
                            <p>2. Właścicielem Serwisu i Sklepu Internetowego jest Mikołaj Lubawy prowadzący działalność gospodarczą pod firmą Appity Mikołaj Lubawy, wpisaną do Centralnej Ewidencji i Informacji o Działalności Gospodarczej (CEIDG) prowadzonej przez ministra właściwego ds. gospodarki, NIP: 7781463016, REGON: 540670410, adres: ul. Ogrodnicza 13, 62-006 Janikowo, adres poczty elektronicznej: kontakt@zozoapp.pl numer telefonu kontaktowego: +48 605 196 222 (opłata jak za połączenie standardowe - wg cennika właściwego operatora).</p>
                            <p>3. Wszystkie informacje, ogłoszenia, reklamy i cenniki dotyczące Produktów prezentowanych w Sklepie Internetowym są zaproszeniem do zawarcia umowy zgodnie z przepisami Kodeksu cywilnego, nie stanowią jednak oferty w rozumieniu prawa.</p>
                            <p>4. Korzystając ze Sklepu Internetowego, zobowiązujesz się do dokładnego zapoznania się z naszym Regulaminem i do jego przestrzegania.</p>
                        </div>
                    </section>

                    <section>
                        <h3 className="text-lg font-semibold">II. DEFINICJE</h3>
                        <p>Użyte w Regulaminie definicje oznaczają:</p>
                        <ul className="list-none pl-0 space-y-2">
                            <li><strong>a) Aplikacja</strong> – oprogramowanie (aplikacja mobilna) o nazwie ZOZO udostępniona i przeznaczona do instalacji na posiadanym przez Klienta urządzeniu mobilnym i pozwalająca w szczególności na korzystanie ze Sklepu Internetowego bez konieczności uruchamiania przeglądarki internetowej.</li>
                            <li><strong>b) BOK</strong> – Biuro Obsługi Klienta, działające za pośrednictwem kanału e-mail kontakt@zozoapp.pl.</li>
                            <li><strong>c) Cena</strong> – określona w złotych polskich lub w innej walucie kwota wynagrodzenia brutto (uwzględniająca podatek) należnego nam tytułem przeniesienia własności Produktu na Klienta, zgodnie z Umową Sprzedaży. Cena nie zawiera kosztów dostawy, chyba że warunki Promocji stanowią inaczej.</li>
                            <li><strong>d) Klient</strong> – każdy podmiot dokonujący zakupów za pośrednictwem Sklepu.</li>
                            <li><strong>e) Przedsiębiorca</strong> – osoba prowadząca działalność gospodarczą, z wyjątkiem przedsiębiorcy będącego osobą fizyczną, który zawiera umowę niezwiązaną bezpośrednio z jego działalnością gospodarczą i niemającą dla niego charakteru zawodowego.</li>
                            <li><strong>f) Kodeks Cywilny</strong> – Ustawa z dnia 23 kwietnia 1964 r. (t.j. Dz.U.2022.1360, ze zm.) – Kodeks cywilny.</li>
                            <li><strong>g) Konto</strong> – usługa świadczona drogą elektroniczna w ramach Sklepu Internetowego dająca dostęp do dodatkowych funkcji Sklepu Internetowego. Każde Konto jest oznaczone indywidualnym loginem oraz zabezpieczone hasłem.</li>
                            <li><strong>h) Koszyk</strong> – usługa świadczona drogą elektroniczną w ramach Sklepu Internetowego umożliwiająca złożenie Zamówienia i skorzystanie z powiązanych z tym funkcji.</li>
                            <li><strong>i) Łączny Koszt Zamówienia</strong> – Cena Produktów, dodanych przez Klienta do Koszyka, powiększona o koszty dostawy oraz inne koszty, jeżeli występują i zostały podane do wiadomości Klienta oraz pomniejszona o ewentualne rabaty, do której zapłaty zobowiązany będzie Klient dokonując zakupów w Sklepie Internetowym</li>
                            <li><strong>j) Produkt</strong> – usługa lub rzecz udostępniona w Sklepie Internetowym rzecz wraz z jej częściami składowymi oznaczona ceną i będąca przedmiotem Umowy Sprzedaży.</li>
                            <li><strong>k) Promocje</strong> – szczególne warunki sprzedaży lub świadczenia usług, które zostały odrębnie uregulowane lub wyartykułowane i są dostępne w ramach Sklepu Internetowego (np. obniżenie Ceny lub kosztów wysyłki).</li>
                            <li><strong>l) Regulamin</strong> – niniejszy dokument, stanowiący integralną część Umowy Sprzedaży.</li>
                            <li><strong>m) Sklep Internetowy</strong> – platforma internetowa, dostępna pod adresem www.niezgubdziecka.pl i w Aplikacji, za pośrednictwem której zawierane są umowy sprzedaży i świadczone są usługi drogą elektroniczną w rozumieniu ustawy z dnia 18 lipca 2002 r. o świadczeniu usług drogą elektroniczną (Dz. U. Nr 144, poz. 1204 ze zmianami).</li>
                            <li><strong>n) Sprzedawca</strong> – Appity Mikołaj Lubawy, wpisany do Centralnej Ewidencji i Informacji o Działalności Gospodarczej (CEIDG) prowadzonej przez ministra właściwego ds. gospodarki, NIP: 7781463016, REGON: 540670410, adres: ul. Ogrodnicza 13, 62-006 Janikowo, adres poczty elektronicznej: kontakt@zozoapp.pl numer telefonu kontaktowego: +48 605 196 222.</li>
                            <li><strong>o) Treści</strong> – teksty, grafiki lub multimedia umieszczone na Stronie internetowej, stanowiące utwory w rozumieniu ustawy o prawie autorskim i prawach pokrewnych oraz wizerunki osób fizycznych, które umieszczone są w widoku Sklepu Internetowego.</li>
                            <li><strong>p) Umowa Sprzedaży</strong> – umowa sprzedaży (w rozumieniu przepisów Kodeksu cywilnego) Produktów pomiędzy Klientem a Sprzedawcą zawierana na odległość za pośrednictwem Sklepu Internetowego na zasadach określonych w Regulaminie.</li>
                            <li><strong>q) Ustawa o Prawach Konsumenta</strong> – Ustawa z dnia 30 maja 2014 r. (t.j. Dz.U.2020.287, ze zm.) - o prawach konsumenta.</li>
                            <li><strong>r) Zamówienie</strong> – oświadczenie woli Klienta wyrażające bezpośrednią wolę zawarcia Umowy Sprzedaży, określające rodzaj i liczbę Produktów, które Klient chce kupić od Sprzedawcy w Sklepie Internetowym stanowiące ofertę Klienta w rozumieniu przepisów Kodeksu Cywilnego oraz zawierające dane Klienta konieczne do zawarcia i wykonania Umowy Sprzedaży.</li>
                        </ul>
                    </section>

                    <section>
                        <h3 className="text-lg font-semibold">III. UMOWA SPRZEDAŻY</h3>
                        <div className="space-y-2">
                            <p>1. Złożenie Zamówienia stanowi złożenie Sprzedawcy przez Klienta oferty zawarcia Umowy Sprzedaży.</p>
                            <p>2. Po złożeniu Zamówienia, Sprzedawca przesyła Klientowi potwierdzenie Zamówienia, które stanowi jedynie potwierdzenie otrzymania przez Sprzedawcę Zamówienia (oferty Klienta) i nie stanowi jeszcze oświadczenia woli zawarcia Umowy Sprzedaży przez Sprzedawcę (nie stanowi oświadczenia o przyjęciu oferty i nie skutkuje zawarciem Umowy Sprzedaży).</p>
                            <p>3. Umowa Sprzedaży zostaje zawarta z chwilą otrzymania przez Klienta potwierdzenia sprzedaży Produktów na podany przez Klienta adres e-mail (otrzymanie przez Klienta oświadczenia woli o przyjęciu oferty przez Sprzedawcę). Wiadomość ta stanowi potwierdzenie zawarcia Umowy Sprzedaży.</p>
                            <p>4. Zobowiązania Klienta wynikające z Umowy Sprzedaży są wykonane z chwilą uiszczenia na rzecz Sprzedawcy ostatecznego łącznego Kosztu Zamówienia.</p>
                            <p>5. Świadczenie Sprzedawcy wynikające z Umowy Sprzedaży jest spełnione z chwilą dostarczenia Klientowi Produktów zgodnie z Zamówieniem.</p>
                            <p>6. Pomimo dołożenia należytej staranności, Sprzedawca nie może zagwarantować stałej dostępności Produktów prezentowanych w Sklepie Internetowym. Informacje o Produktach podane na stronie internetowej Sprzedawcy stanowią zaproszenie do zawarcia umowy, w rozumieniu art. 71 Kodeksu cywilnego. Nie stanowią one oferty ani zapewnienia Sprzedawcy w zakresie dostępności Produktów.</p>
                            <p>7. W przypadku braku dostępności Produktów, objętych Zamówieniem złożonym przez Klienta, Klientowi zostanie dostarczone Zamówienie tylko z Produktami aktualnie dostępnymi. W przypadkach opisanych w niniejszym punkcie Łączny Koszt Zamówienia ulegnie odpowiednio zmniejszeniu o wartość niedostępnych Produktów.</p>
                            <p>8. Założenie Konta nie jest konieczne do złożenia Zamówienia w Serwisie.</p>
                            <p>9. Aby zawrzeć Umowę Sprzedaży w Sklepie Internetowym należy najpierw poprawnie złożyć Zamówienie na Produkt. W celu złożenia Zamówienia trzeba kolejno:
                                <br />a) wyszukać interesujący model Produktu w Sklepie Internetowym;
                                <br />b) wybrać spośród dostępnych opcji ilość;
                                <br />c) kliknąć przycisk Dodaj do koszyka, przy czym dodanie Produktu do Koszyka nie stanowi jego rezerwacji;
                                <br />d) przejść do zakładki Koszyk;
                                <br />e) kliknąć przycisk Przejdź do kasy i wypełnić wymagane do złożenia Zamówienia dane, w tym w szczególności adres e-mail;
                                <br />f) jeżeli posiadasz Konto, wówczas możesz się do niego zalogować, a wtedy dane do Zamówienia zostaną uzupełnione automatycznie,
                                <br />g) wybrać metody dostawy i płatności oraz inne informacje wymagane dla danego Zamówienia;
                                <br />h) wyrazić zgody formalne co najmniej w zakresie niezbędnym do złożenia Zamówienia, w tym w szczególności zaakceptować Regulamin;
                                <br />i) kliknąć przycisk Zamawiam i płacę, co oznacza potwierdzenie prawidłowości danych zawartych w formularzu Zamówienia, akceptację Regulaminu oraz złożenie Zamówienia do Sprzedawcy;
                                <br />j) opłacić Zamówienie zgodnie z wybranym sposobem płatności;
                            </p>
                            <p>10. Jeżeli złożone Zamówienie obejmuje Produkt, którego nie można kupić w wykorzystaniem określonego sposobu płatności lub dostawy to ograniczenie to może objąć również pozostałe Produkty objęte tym Zamówieniem.</p>
                            <p>11. Jeżeli Zamówienie nie przejdzie pozytywnej weryfikacji może zostać anulowane.</p>
                            <p>12. Niezwłocznie po zweryfikowaniu Zamówienia otrzymasz od nas wiadomość e-mail zawierającą potwierdzenie przez Sprzedawcę realizacji Zamówienia w całości.</p>
                            <p>13. Umowy Sprzedaży zawierane są odrębnie w ramach każdego Produktu, chyba że co innego wynika z odrębnych regulaminów lub warunków Promocji lub innych zasad sprzedaży, które zostały udostępnione i na które została wyrażona zgoda.</p>
                            <p>14. Jeżeli Zamówienie zostanie anulowane w całości lub części, wówczas Klient otrzymuje zwrot uiszczonych płatności za tę część Zamówienia, która została anulowana.</p>
                            <p>15. Sprzedawca w zakresie, w którym nie jest zwolniony z obowiązku wystawienia paragonu fiskalnego dokumentującego transakcję, ma prawo przekazać go w formie elektronicznej, jeśli Klient wyraża na to zgodę.</p>
                            <p>16. Jeżeli Klient żąda od Sprzedawcy wystawienia faktury VAT, to wyraża zgodę, aby została ona przesłana na podany podczas składania Zamówienia adres e-mail. Dla zachowania bezpieczeństwa danych, dostęp do faktury VAT może być zabezpieczony przez techniczne sposoby uwierzytelniania.</p>
                        </div>
                    </section>

                    <section>
                        <h3 className="text-lg font-semibold">IV. CENY PRODUKTÓW, ŁĄCZNY KOSZT ZAMÓWIENIA, SPOSOBY I TERMINY PŁATNOŚCI ZA PRODUKT</h3>
                        <div className="space-y-2">
                            <p>1. Ceny Produktów prezentowane w Sklepie Internetowym obowiązują Klienta dokonującego zakupów w Sklepie Internetowym.</p>
                            <p>2. Ceny Produktów zamieszczone w Sklepie Internetowym są cenami brutto. Ceny Produktów zawierają wszelkie cła i podatki, w tym podatek VAT, nie zawierają natomiast kosztów dodatkowych, które Klient będzie zobowiązany ponieść w związku z Umową Sprzedaży w tym kosztów dostawy, wskazanych przy składaniu Zamówienia w Sklepie Internetowym. Wszystkie Ceny Produktów oraz Łączny Koszt Zamówienia podawane są w złotych polskich.</p>
                            <p>3. Wszelkie dodatkowe koszty, w tym koszt dostawy, składające się na Łączny Koszt Zamówienia widoczne będą w Koszyku, przed złożeniem Zamówienia.</p>
                            <p>4. Promocje obowiązujące w Sklepie Internetowym nie mogą być ze sobą łączone.</p>
                            <p>5. Bezpośrednio przed złożeniem Zamówienia Klient wybiera dostępny z opcji sposób płatności.</p>
                            <p>6. Rozliczenia transakcji płatnościami elektronicznymi i kartą płatniczą przeprowadzane są zgodnie z Twoim wyborem za pośrednictwem upoważnionych serwisów.</p>
                            <p>7. Zamówienie może zostać anulowane, a Umowa Sprzedaży niezawarta, w przypadku:
                                <br />a) braku opłacenia Zamówienia niezwłocznie, nie później niż w ciągu 20 minut od złożenia Zamówienia w przypadku płatności elektronicznej albo płatności kartą płatniczą;
                                <br />b) braku zawarcia umowy o kredyt konsumencki w ciągu 2 godzin od złożenia Zamówienia w przypadku wyboru metody płatności z odroczonym terminem zapłaty.
                            </p>
                            <p>8. W przypadku wyboru płatności za pobraniem należy dokonać płatności przy odbiorze przesyłki. Nieodebranie Produktu jest warunkiem rozwiązującym Umowę Sprzedaży. Powyższe nie dotyczy jednak Produktów nieprefabrykowanych wyprodukowanych według indywidualnej specyfikacji Klienta.</p>
                            <p>9. W przypadku wyboru płatności z góry, brak odbioru Produktu w wyznaczonym terminie, stanowi warunek rozwiązujący Umowę Sprzedaży- w takiej sytuacji Sprzedawca zwróci Klientowi uiszczoną płatność niezwłocznie po otrzymaniu Produktu z powrotem, nie później jednak niż w terminie 14 dni od rozwiązania Umowy. Powyższe nie dotyczy jednak Produktów nieprefabrykowanych wyprodukowanych według specyfikacji Klienta lub służących zaspokojeniu zindywidualizowanych potrzeb Klienta.</p>
                        </div>
                    </section>

                    <section>
                        <h3 className="text-lg font-semibold">V. KOSZT, SPOSOBY I TERMIN DOSTAWY PRODUKTU</h3>
                        <div className="space-y-2">
                            <p>1. Dostawa Produktów, które można kupić w Sklepie Internetowym wykonywana jest głównie na terytorium Rzeczypospolitej Polskiej.</p>
                            <p>2. Dostawa Produktu jest odpłatna, chyba że z treści zawartej Umowy Sprzedaży wynika inaczej, np. Sprzedawca może oferować darmową dostawę po osiągnięciu określonej wartości Zamówienia lub dla określonych Produktów.</p>
                            <p>3. Dostępne dla danego Zamówienia sposoby dostawy przedstawione będą do wyboru przy finalizacji Zamówienia.</p>
                            <p>4. Po zawarciu Umowy Sprzedaży kupiony Produkt zostanie dostarczony w terminie do 5 dni roboczych od dnia złożenia Zamówienia. W szczególnie uzasadnionych przypadkach termin ten może ulec wydłużeniu, nie więcej jednak niż do 14 dni od dnia zwarcia Umowy Sprzedaży, o czym poinformujemy niezwłocznie.</p>
                        </div>
                    </section>

                    <section>
                        <h3 className="text-lg font-semibold">VI. REKLAMACJE I ZWROTY (ODSTĄPIENIE OD UMOWY SPRZEDAŻY)</h3>
                        <h4 className="font-semibold mt-4">A. REKLAMACJE</h4>
                        <div className="space-y-2">
                            <p>1. Wszelkie reklamacje dotyczące realizacji Zamówienia, zakupionych Produktów w Sklepie Internetowym mogą być zgłaszane na adres e-mail: kontakt@zozoapp.pl</p>
                            <p>2. Zgodnie z art. 558 § 1 Kodeksu Cywilnego odpowiedzialność Sprzedawcy z tytułu rękojmi za Produkt wobec Przedsiębiorcy, z wyłączeniem przedsiębiorcy na prawach konsumenta, jest wyłączona.</p>
                            <p>3. Uprawnienia Klientów z tytułu braku zgodności towaru z umową określone są w Rozdziale 5a ustawy z dnia 30 maja 2014 r. – o prawach konsumenta.</p>
                            <p>4. Sprzedawca ponosi odpowiedzialność za brak zgodności Produktu z Umową Sprzedaży istniejący w chwili jego dostarczenia i ujawniony w ciągu dwóch lat od tej chwili, chyba że termin przydatności Produktu do użycia, określony przez Sprzedawcę, jego poprzedników prawnych lub osoby działające w ich imieniu jest dłuższy. Domniemywa się, że brak zgodności Produktu z Umową Sprzedaży, który ujawnił się przed upływem dwóch lat od chwili dostarczenia Produktu, istniał w chwili jego dostarczenia, o ile nie zostanie udowodnione inaczej lub domniemania tego nie można pogodzić ze specyfiką Produktu lub charakterem braku zgodności towaru z umową.</p>
                            <p>5. Sprzedawca nie może powoływać się na upływ terminu do stwierdzenia braku zgodności Produktu z Umową Sprzedaży określonego w ust. 3 powyżej, jeżeli brak ten podstępnie zataił.</p>
                            <p>6. Jeżeli Produkt jest niezgodny z Umową Sprzedaży, Klient może żądać jego naprawy lub wymiany.</p>
                            <p>7. Sprzedawca może dokonać wymiany, gdy Klient żąda naprawy lub Sprzedawca może dokonać naprawy, gdy Klient żąda wymiany, jeżeli doprowadzenie do zgodności Produktu z Umową Sprzedaży w sposób wybrany przez Klienta jest niemożliwe albo wymagałoby nadmiernych kosztów dla Sprzedawcy. Jeżeli naprawa i wymiana są niemożliwe lub wymagałyby nadmiernych kosztów dla Sprzedawcy, może on odmówić doprowadzenia Produktu do zgodności z Umową Sprzedaży.</p>
                            <p>8. Przy ocenie nadmierności kosztów uwzględnia się wszelkie okoliczności sprawy, w szczególności znaczenie braku zgodności Produktu z Umową Sprzedaży, wartość Produktu zgodnego z Umową Sprzedaży oraz nadmierne niedogodności dla Klienta powstałe wskutek zmiany sposobu doprowadzenia Produktu do zgodności z Umową Sprzedaży.</p>
                            <p>9. Sprzedawca dokonuje naprawy lub wymiany w rozsądnym czasie od chwili, w której został poinformowany przez Klienta o braku zgodności z Umową Sprzedaży i bez nadmiernych niedogodności dla Klienta, uwzględniając specyfikę Produktu oraz cel w jakim Klient go nabył. Koszty naprawy lub wymiany, w tym w szczególności koszty opłat pocztowych, przewozu, robocizny i materiałów ponosi Sprzedawca.</p>
                            <p>10. Klient udostępnia Sprzedawcy Produkt podlegający naprawie lub wymianie. Sprzedawca odbiera od Klienta Produkt na swój koszt.</p>
                            <p>11. Jeżeli Produkt jest niezgodny z Umową Sprzedaży, Klient może złożyć oświadczenie o obniżeniu ceny albo odstąpieniu od Umowy Sprzedaży, gdy:
                                <br />- Sprzedawca odmówił doprowadzenia Produktu do zgodności z Umową Sprzedaży,
                                <br />- Sprzedawca nie doprowadził Produktu do zgodności z Umową Sprzedaży;
                                <br />- brak zgodności Produktu z Umową Sprzedaży istnieje nadal, mimo że Sprzedawca próbował doprowadzić Produkt do zgodności z Umową Sprzedaży;
                                <br />- brak zgodności Produktu z Umową Sprzedaży jest na tyle istotny, że uzasadnia obniżenie ceny albo odstąpienie od Umowy Sprzedaży bez uprzedniego skorzystania ze środków ochrony wskazanych powyżej;
                                <br />- z oświadczenia Sprzedawcy lub okoliczności wyraźnie wynika, że nie doprowadzi on Produktu do zgodności z Umową Sprzedaży w rozsądnym czasie lub bez nadmiernych niedogodności dla Klienta.
                            </p>
                            <p>11. Sprzedawca zwraca Klientowi kwoty należne wskutek skorzystania z prawa obniżenia ceny niezwłocznie, nie później niż w terminie 14 dni od dnia otrzymania oświadczenia Klienta o obniżeniu ceny.</p>
                            <p>12. Klient nie może odstąpić od Umowy Sprzedaży, jeżeli brak zgodności Produktu z Umową Sprzedaży jest nieistotny.</p>
                            <p>13. W razie odstąpienia od Umowy Sprzedaży Klient niezwłocznie zwraca Produkt Sprzedawcy na jego koszt. Sprzedawca zwraca Klientowi cenę niezwłocznie, nie później niż w terminie 14 dni od dnia otrzymania Produktu lub dowodu jego odesłania.</p>
                            <p>14. Sprzedawca dokonuje zwrotu ceny przy użyciu takiego samego sposobu zapłaty, jakiego użył Klient, chyba że Klient wyraźnie zgodził się na inny sposób zwrotu, który nie wiąże się dla niego z żadnymi kosztami. Zwrot uwzględnia wszystkie rabaty otrzymane przy zakupie.</p>
                            <p>15. W ramach odpowiedzialności z tytułu braku zgodności Produktu z Umową Sprzedaży, Sprzedawca nie ma obowiązku dostarczenia Klientowi zastępczego towaru na czas trwania procedury reklamacyjnej.</p>
                            <p>16. Sprzedawca rozpatrzy reklamację w ciągu 14 dni od dnia jej otrzymania. W przypadku uznania reklamacji, Klient uzyskuje informację w jaki sposób została rozpatrzona reklamacja w szczególności czy reklamowany Produkt zostanie wymieniony, naprawiony czy nastąpi zwrot pieniędzy.</p>
                            <p>17. Sprzedawca nie ponosi odpowiedzialności za brak zgodności Produktu z Umową Sprzedaży, jeżeli Klient najpóźniej w chwili zawarcia Umowy Sprzedaży został wyraźnie poinformowany, że konkretna cecha Produktu odbiega od wymogów zgodności z Umową Sprzedaży oraz wyraźnie i odrębnie zaakceptował brak konkretnej cechy Produktu (produkt outletowy).</p>
                        </div>

                        <h4 className="font-semibold mt-4">B. ZWROTY (ODSTĄPIENIE OD UMOWY)</h4>
                        <div className="space-y-2">
                            <p>1. Klient ma prawo odstąpić od Umowy Sprzedaży, bez podawania przyczyny w terminie 14 dni od dnia, w którym Klient lub wskazana przez niego osoba trzecia objęła Produkt w posiadanie. Do zachowania ww. terminu wystarczy wysłanie oświadczenia o odstąpieniu od Umowy Sprzedaży przed jego upływem.</p>
                            <p>2. Przy odstąpieniu od umowy zawartej na odległość koszt odesłania towaru ponosi konsument.</p>
                            <p>3. Klient może złożyć oświadczenie o odstąpieniu od Umowy Sprzedaży poprzez dołączenie go do zwracanego Produktu lub przesłanie na adres: kontakt@zozoapp.pl</p>
                            <p>4. W przypadku odstąpienia przez Klienta od Umowy Sprzedaży, Umowę Sprzedaży uważa się za niezawartą.</p>
                            <p>5. Oświadczenie o odstąpieniu od Umowy Sprzedaży powinno zawierać informację jakich zamówionych Produktów dotyczy odstąpienie od Umowy Sprzedaży oraz dowód zakupu (np. paragon fiskalny, potwierdzenie płatności kartą) lub jego kopię, a także wskazanie numeru Zamówienia.</p>
                            <p>6. Sprzedawca zwraca Klientowi wszystkie dokonane przez niego w związku z Umową Sprzedaży płatności, w tym koszty dostawy (zwraca się równowartość najtańszego zwykłego sposobu dostawy oferowanego w sklepie). Za zwrócone Produkty Klient otrzymuje ich równowartość tożsamą z kwotą na przedłożonym dowodzie zakupu. Klient ponosi bezpośrednie koszty związane ze zwrotem Produktów.</p>
                            <p>7. Klient ma obowiązek zwrócić Produkt (lub Produkty) objęte odstąpieniem Sprzedawcy lub przekazać osobie upoważnionej przez Sprzedawcę niezwłocznie, jednak nie później niż 14 dni od dnia, w którym odstąpił od Umowy Sprzedaży. Bezpośrednie koszty zwrotu Produktu (lub Produktów) ponosi Klient.</p>
                            <p>8. Sprzedawca dokonuje zwrotu płatności otrzymanych od Klienta niezwłocznie, nie później jednak niż w ciągu 14 dni od dnia otrzymania oświadczenia Klienta o odstąpieniu od Umowy Sprzedaży. Sprzedawca ma prawo do powstrzymania się od zwrotu płatności otrzymanych od Klienta do chwili otrzymania Produktów od Klienta.</p>
                            <p>9. Zwrot Produktów powinien nastąpić w stanie niezmienionym, chyba że zmiana była konieczna w granicach zwykłego zarządu. Klient ponosi odpowiedzialność za zmniejszenie wartości Produktów będące wynikiem korzystania z nich w sposób wykraczający poza konieczny do stwierdzenia charakteru, cech i funkcjonowania Produktów. Zwracany Produkt powinien być kompletny.</p>
                            <p>10. Przy zwrocie Produktu/ów w wyniku odstąpienia Klienta od Umowy Sprzedaży, Sprzedawca uprawniony jest do zbadania stanu Produktu/ów. Klient ponosi odpowiedzialność za zmniejszenie wartości Produktu będące wynikiem korzystania z niego w sposób wykraczający poza konieczny do stwierdzenia charakteru, cech i funkcjonowania Produktów.</p>
                            <p>11. Prawo do odstąpienia od Umowy Sprzedaży nie przysługuje Klientowi w odniesieniu m.in. do umów:
                                <br />- w której przedmiotem świadczenia jest rzecz dostarczana w zapieczętowanym opakowaniu, której po otwarciu opakowania nie można zwrócić ze względu na ochronę zdrowia lub ze względów higienicznych, jeżeli opakowanie zostało otwarte po dostarczeniu;
                                <br />- w której przedmiotem świadczenia są rzeczy, które po dostarczeniu, ze względu na swój charakter, zostają nierozłącznie połączone z innymi rzeczami.
                            </p>
                            <p>12. Formularz odstąpienia od umowy stanowi Załącznik nr 1 do niniejszego Regulaminu.</p>
                        </div>
                    </section>

                    <section>
                        <h3 className="text-lg font-semibold">VII. WYŁĄCZENIE ODPOWIEDZIALNOŚCI</h3>
                        <div className="space-y-2">
                            <p>1. Produkty, w szczególności tatuaże oraz Aplikacja służą wyłącznie jako dodatkowe narzędzie ułatwiające identyfikację i kontakt z bliskimi/dzieckiem.</p>
                            <p>2. Sprzedawca nie gwarantuje, że aplikacja będzie działać nieprzerwanie, bezbłędnie i w każdych warunkach technicznych (np. brak zasięgu, awarie sieci, błędy systemów zewnętrznych).</p>
                            <p>3. Sprzedawca nie ponosi odpowiedzialności za skuteczność odszukania osoby bliskiej/dziecka za pomocą Produktów, w szczególności tatuaży ani za szkody powstałe w wyniku niemożności korzystania z aplikacji lub Produktu, w szczególności tatuażu z przyczyn technicznych lub niezależnych od Sprzedawcy i osób z nim współpracujących lub mu podlegających w stosunku zawodowym.</p>
                            <p>4. W odniesieniu do Produktów, w szczególności tatuaży, odpowiedzialność za nadzór i bezpieczeństwo dziecka zawsze spoczywa na rodzicu lub opiekunie.</p>
                        </div>
                    </section>

                    <section>
                        <h3 className="text-lg font-semibold">VIII. USŁUGI ELEKTRONICZNE W SKLEPIE INTERNETOWYM I APLIKACJI MOBILNEJ</h3>
                        <div className="space-y-2">
                            <p>1. Korzystanie ze Sklepu Internetowego możliwe jest pod warunkiem, że korzystający jest osobą fizyczną, posiadającą pełną zdolność do czynności prawnych, lub osobą prawną, lub jednostką organizacyjną nieposiadającą osobowości prawnej, ale mogącą we własnym imieniu nabywać prawa i zaciągać zobowiązania. W przypadku, gdy korzystający posiada jedynie ograniczoną zdolność do czynności prawnych, w celu korzystania z Sklepu Internetowego, powinien on uzyskać prawnie skuteczną zgodę swojego przedstawiciela ustawowego na zawarcie umowy o świadczenie usług oraz Umowy Sprzedaży i przedstawić tę zgodę Sprzedawcy, jeżeli będzie to konieczne. Umowy Sprzedaży zawierane w ramach Sklepu Internetowego mają charakter umów powszechnie zawieranych w drobnych bieżących sprawach życia codziennego.</p>
                            <p>2. Ze Sklepu Internetowego można korzystać poprzez stronę sieci Web lub Aplikację. Aby w pełni korzystać ze Sklepu Internetowego, należy spełnić poniższe warunki techniczne:</p>
                            <p>A. Dla strony sieci Web:
                                <br />Komputer, laptop lub inne urządzenie multimedialne z dostępem do Internetu; dostęp do poczty elektronicznej oraz aktywny adres e-mail; (przeglądarka internetowa: Mozilla Firefox, Microsoft Edge, Opera, Google Chrome, Safari w wersji z ostatnich 24 miesięcy; zalecana minimalna rozdzielczość ekranu: 1024x768; włączenie w przeglądarce internetowej możliwości zapisu plików Cookies oraz obsługi Javascript.
                            </p>
                            <p>B. Dla Aplikacji:
                                <br />Urządzenie mobilne z aktywnym dostępem do Internetu i zainstalowanym systemem Android w wersji zaktualizowanej do wersji nie starszej niż sprzed ostatnich 2 lat oraz dostępnymi usługami Google lub system iOS w wersji zaktualizowanej do wersji nie starszej niż sprzed ostatnich 2 lat.
                                <br />W zakresie niektórych funkcji urządzenie mobilne z aparatem fotograficznym i usługą geolokalizacji (GPS). Aplikacja powinna być zaktualizowana do najnowszej dostępnej wersji.
                            </p>
                            <p>3. Aby zawrzeć Umowę Sprzedaży, należy posiadać aktywny adres e-mail, a także w określonych przypadkach klawiaturę lub inne urządzenie, umożliwiające poprawne wypełnienie formularzy elektronicznych.</p>
                            <p>4. Poprzez Sklep Internetowy świadczymy usługi drogą elektroniczną w rozumieniu ustawy z dnia 18 lipca 2002 r. o świadczeniu usług drogą elektroniczną (Dz. U. Nr 144, poz. 1204 ze zmianami). Usługi te obejmują w szczególności korzystanie z Konta oraz jego funkcji, zarządzanie zgodami na komunikację marketingową, składanie Zamówień i zawieranie Umów Sprzedaży, korzystanie z Koszyka, dostęp do Treści, otrzymywanie informacji handlowych.</p>
                            <p>5. Korzystając ze Sklepu Internetowego Klient zobowiązuje się do:
                                <br />- podawania wszystkich koniecznych dla danej usługi danych, które są prawdziwe i aktualne;
                                <br />- niezwłocznego aktualizowania danych, w tym danych osobowych, podanych w związku z zawarciem umowy o świadczenie usług, w tym usług świadczonych drogą elektroniczną lub Umowy Sprzedaży;
                                <br />- niezakłócania funkcjonowania Sklepu Internetowego lub Aplikacji;
                                <br />- działania w sposób zgodny z przepisami prawa, postanowieniami Regulaminu, a także z przyjętymi w danym zakresie zwyczajami i zasadami współżycia społecznego;
                                <br />- terminowej płatności za Produkt i terminowego odbioru Produktu zakupionego poprzez Sklep Internetowy;
                            </p>
                            <p>6. Aplikację można pobrać tylko z oficjalnych sklepów:
                                <br />- Apple App Store – dla urządzeń mobilnych z systemem operacyjnym iOS;
                                <br />- Google Play/Sklep – Play, dla urządzeń mobilnych z systemem operacyjnym Android.
                            </p>
                            <p>7. Korzystanie z Aplikacji pobranej z innego źródła niż oficjalny sklep wiąże się z ryzykiem naruszenia integralności Aplikacji i połączenia ze szkodliwym oprogramowaniem, co stanowi zagrożenie dla bezpieczeństwa urządzenia mobilnego Klienta i przechowywanych w nim danych.</p>
                            <p>8. Aplikacja wykorzystuje technologie przechowywania danych (dostęp do pamięci urządzenia) w celu umożliwienia działania w trybie offline, przyspieszenia ładowania danych, raportów błędów i zapamiętywania preferencji użytkowników. Dostęp do pamięci urządzenia mobilnego jest wymagany dla funkcjonalności aplikacji. Identyfikator użytkownika jak i urządzenia, a także identyfikatory np. sesji są używane w celach marketingowych a także technicznych, i są przechowywane do momentu odinstalowania Aplikacji.</p>
                            <p>9. Konto jest usługą, która pozwala na przechowywanie danych adresowych i wykorzystanie ich do przyszłych Zamówień. Dodatkowo, Konto umożliwia śledzenie statusu złożonego Zamówienia, dostęp do historii Zamówień oraz innych oferowanych w nim funkcji.</p>
                            <p>10. Po zakończeniu rejestracji Konta na wskazany w formularzu rejestracji adres e-mail Klient otrzyma wiadomość potwierdzającą utworzenie Konta, co jest jednoznaczne z zawarciem umowy o świadczenie usług drogą elektroniczną w przedmiocie usługi Konta. Umowa ta jest zawarta na czas nieokreślony.</p>
                            <p>11. Poza reklamacją dotyczącą wadliwości Produktu, Klient ma prawo do składania reklamacji dotyczących działalności Sprzedawcy i świadczonych przez Sprzedawcę usług drogą elektroniczną. Reklamacje te zalecamy składać: w formie elektronicznej na adres: kontakt@zozoapp.pl lub w formie listownej na adres: ul. Ogrodnicza 13, 62-006 Janikowo.</p>
                            <p>12. W reklamacji należy wskazać informacje i okoliczności dotyczące przedmiotu reklamacji, w szczególności (1) rodzaju i daty wystąpienia nieprawidłowości; (2) swoje żądania oraz (3) swoje dane kontaktowe, w tym adres e-mail. 20. Odpowiedzi na reklamację udzielimy na adres e-mail, który wskazałeś podczas składania reklamacji, chyba że indywidulanie uzgodniłeś z nami inną formę kontaktu.</p>
                            <p>13. Odpowiedź na reklamację Klient otrzyma nie później niż po 14 dniach od dania jej złożenia.</p>
                            <p>14. Klientowi przysługuje prawo do odstąpienia bez podania przyczyn od zawartej umowy o świadczenie usług drogą elektroniczną. Oświadczenie o odstąpieniu od umowy o świadczenie usług drogą elektroniczną należy wysłać w terminie czternastu (14) dni kalendarzowych począwszy od dnia zawarcia umowy w formie elektronicznej na adres: kontakt@zozoapp.pl lub listownie na adres: ul. Ogrodnicza 13, 62-006 Janikowo. W przypadku odstąpienia od umowy, umowa ta uważana jest za niezawartą.</p>
                            <p>15. Klient w każdej chwili i bez podania przyczyny, ma prawo wypowiedzieć zawartą umowę o świadczenie usług drogą elektroniczną z zachowaniem 14 dniowego okresu wypowiedzenia. W tym celu należy wysłać oświadczenie o wypowiedzeniu tej umowy w formie elektronicznej na adres: kontakt@zozoapp.pl lub listownie na adres: ul. Ogrodnicza 13, 62-006 Janikowo.</p>
                            <p>16. Sprzedawca ma prawo do rozwiązania z Klientem umowy o świadczenie usług drogą elektroniczną w każdym czasie i z zachowaniem miesięcznego okresu wypowiedzenia, ale tylko w przypadku wystąpienia ważnych przyczyn, wskazanych poniżej:
                                <br />a) zmiana przepisów prawa lub wykładni wpływające istotnie na świadczenie usług drogą elektroniczną;
                                <br />b) zaprzestanie przez Sprzedawcę działalności handlowej i usługowej;
                                <br />c) zmiana sposobu świadczenia usług spowodowana wyłącznie względami technicznymi lub technologicznymi;
                                <br />d) zmiana zakresu świadczenia usług, do których stosują się zapisy Regulaminu, poprzez wprowadzenie nowych, modyfikację lub wycofanie przez Sprzedawcę dotychczasowych funkcji lub usług objętych Regulaminem;
                                <br />e) brak aktywności Klienta w Sklepie Internetowym i logowań do Konta przez okres minimum 3 lat.
                            </p>
                            <p>17. Klient i Sprzedawca mają prawo do wypowiedzenia ze skutkiem natychmiastowym zawartej umowy o świadczenie usług drogą elektroniczną, w przypadku, gdy druga strona rażąco narusza postanowienia Regulaminu w zakresie korzystania z usługi. Konsument zostanie wcześniej wezwany do zaprzestania naruszeń w terminie 3 dni od doręczenia wezwania. Dopiero niezastosowanie się do tego wezwania będzie skutkowało rozwiązaniem umowy. Wypowiedzenie to należy złożyć w formie elektronicznej na adres: kontakt@zozoapp.pl lub listownie na adres: ul. Ogrodnicza 13, 62-006 Janikowo.</p>
                            <p>18. Wezwania oraz oświadczenia, o których mowa w ust. powyżej są wysyłane na podany Sprzedawcy przez Klienta aktualny adres e-mail Klienta.</p>
                        </div>
                    </section>

                    <section>
                        <h3 className="text-lg font-semibold">IX. POSTANOWIENIA KOŃCOWE</h3>
                        <div className="space-y-2">
                            <p>1. Niniejszy Regulamin wchodzi w życie w terminie 14 dni od dnia jego publikacji w Sklepie Internetowym.</p>
                            <p>2. Do spraw uregulowanych w niniejszym Regulaminie stosuje się prawo polskie, chyba, że co innego wynika w przepisów prawa bezwzględnie obowiązujących.</p>
                            <p>3. Jeżeli jedno z postanowień niniejszego Regulaminu przestanie obowiązywać wskutek zmian przepisów prawa lub orzeczenia sądu, nie ma to żadnego wpływu na ważność i przestrzeganie pozostałych postanowień Regulaminu.</p>
                            <p>4. Wszelkie spory pomiędzy Sprzedawcą, a Klientem- konsumentem, które nie zostaną rozstrzygnięte polubownie, będą rozstrzygane zgodnie z Kodeksem postępowania cywilnego przez właściwe sądy powszechne w Polsce, chyba, że co innego wynika z bezwzględnie obowiązujących przepisów prawa.</p>
                            <p>5. Postanowienia niniejszego Regulaminu nie wyłączają ani nie ograniczają jakichkolwiek praw konsumentów przysługujących im na mocy bezwzględnie wiążących przepisów prawa. W przypadku ewentualnej niezamierzonej niezgodności postanowień niniejszego Regulaminu z powyższymi przepisami, pierwszeństwo mają te przepisy i są one stosowane przez Sprzedawcę.</p>
                            <p>6. Wszelkie spory powstałe pomiędzy Sprzedawcą a Przedsiębiorcą (z wyłączeniem przedsiębiorcy na prawach konsumenta) zostają poddane sądowi właściwemu ze względu na siedzibę Sprzedawcy.</p>
                            <p>7. Sprzedawca zastrzega sobie prawo do dokonywania zmian niniejszego Regulaminu, w przypadku wystąpienia ważnego powodu jakim jest:
                                <br />- zmiana powszechnie obowiązujących przepisów prawa lub ich wykładni stosowanej przez uprawnione organy, mająca bezpośredni wpływ na treść Regulaminu i skutkująca koniecznością jego dostosowania do takiej zmiany przepisów lub ich wykładni;
                                <br />- wydanie orzeczenia, decyzji lub innego podobnego aktu przez sąd lub uprawniony organ władzy publicznej, mającego bezpośredni wpływ na treść Regulaminu i skutkującego koniecznością jego zmiany w celu dostosowania do takiego orzeczenia, decyzji lub innego podobnego aktu;
                                <br />- bezpieczeństwo, w tym zapobieganie naruszeniom Regulaminu lub przeciwdziałanie nadużyciom;
                                <br />- usunięcie niejasności lub wątpliwości interpretacyjnych dotyczących treści Regulaminu;
                                <br />- zmiana w zakresie procedury składania Zamówień, zasad zawierania Umowy Sprzedaży lub warunków jej realizacji;
                                <br />- zmiana funkcjonalności dostępnych w Sklepie Internetowym;
                                <br />- zmiana zasad funkcjonowania Sklepu Internetowego;
                                <br />- zmiana w zakresie nazw, adresów lub danych firmowych wskazanych w treści Regulaminu;
                                <br />- konieczność skorygowania sformułowań niejasnych lub budzących wątpliwości lub poprawy oczywistych omyłek pisarskich, które ewentualnie wystąpiłby w Regulaminie.
                            </p>
                            <p>8. Sprzedawca poinformuje Klientów o zmianach niniejszego Regulaminu, poprzez zamieszczenie ujednoliconego tekstu Regulaminu w Sklepie Internetowym. Wszelkie zmiany Regulaminu wchodzą w życie w terminie 14 dni od dnia ich opublikowania. Zmiany Regulaminu pozostają bez wpływu na Umowy Sprzedaży zawarte zgodnie z Regulaminem.</p>
                            <p>9. Jeżeli obowiązujący przepis prawa, orzeczenie lub inny podobny akt uprawnionego organu władzy publicznej będzie wymagał od Sprzedawcy wprowadzenia zmiany Regulaminu Sklepu w krótszym terminie, niż wskazany w ust. powyżej, powiadomienie o zmianie Regulaminu Sklepu, będzie wskazywać taki krótszy termin wraz ze wskazaniem przyczyny.</p>
                        </div>
                    </section>
                </CardContent>
            </Card>
        </div>
    );
}
