'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

export default function PolitykaPrywatnosciPage() {
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
                    <CardTitle>POLITYKA PRYWATNOŚCI</CardTitle>
                </CardHeader>
                <CardContent className="prose dark:prose-invert max-w-none text-sm space-y-6">
                    <section>
                        <h3 className="text-lg font-semibold">I. GROMADZENIE I PRZETWARZANIE DANYCH OSOBOWYCH</h3>
                        <div className="space-y-2">
                            <p>1. Administratorem Państwa danych osobowych jest Mikołaj Lubawy prowadzący działalność gospodarczą pod firmą Appity Mikołaj Lubawy, wpisaną do Centralnej Ewidencji i Informacji o Działalności Gospodarczej (CEIDG) prowadzonej przez ministra właściwego ds. gospodarki, NIP: 7781463016, REGON: 540670410, adres: ul. Ogrodnicza 13, 62-006 Janikowo, adres poczty elektronicznej: kontakt@zozoapp.pl numer telefonu kontaktowego: +48 605 196 222 (opłata jak za połączenie standardowe - wg cennika właściwego operatora).</p>
                            <p>2. Dane osobowe, czyli informacje o zidentyfikowanej lub możliwej do zidentyfikowania osobie fizycznej, przekazane przez Klientów za pośrednictwem formularzy elektronicznych dostępnych na stronach Sklepu Internetowego (w tym imię, nazwisko, adresy pocztowe, numery telefonów i adresy e-mail, a także nr NIP) są gromadzone i wykorzystywane przez Administratora danych osobowych wyłącznie w celu realizacji umowy oraz podjęcia niezbędnych działań przed zawarciem umowy, w szczególności w celu:
                                <br />- założenia konta i rejestracji Użytkowników,
                                <br />- realizacji akcji marketingowych, w tym wysyłania spersonalizowanych i automatycznych komunikatów z wykorzystaniem analizy dokonanych zakupów za pomocą email, SMS i innych kanałów, pod warunkiem, że Klient zaznaczył zgodę na otrzymywanie informacji handlowych i marketingowych.
                            </p>
                            <p>3. Podstawą prawną przetwarzania Państwa danych jest:
                                <br />- umowa pomiędzy Państwem a Administratorem, do której zawarcia dochodzi wskutek akceptacji Regulaminu i dla wykonania której przetwarzanie Państwa danych jest niezbędne,
                                <br />- zgoda, której udzieliliście Państwo na przetwarzanie danych w celach marketingowych lub w związku z subskrypcją newslettera, lub
                                <br />- prawnie uzasadnione interesy realizowane przez Administratora lub przez osobę trzecią.
                            </p>
                            <p>4. Podanie danych niezbędnych do wystawienia faktury jest obowiązkiem ustawowym i wynika z Ustawy o podatku od towarów i usług.</p>
                            <p>5. Wskazanie danych osobowych nie jest obowiązkowe, przy czym ich niepodanie spowoduje, że zawarcie i realizacja umowy będą niemożliwe, w szczególności niepodanie danych osobowych uniemożliwi realizację zamówień, a także kontakt z Państwem i skorzystanie z niektórych funkcjonalności oferowanych przez Sklep Internetowy.</p>
                            <p>6. Państwa dane przetwarzane będą wyłącznie w przypadku posiadania przez Sklep Internetowy z podstaw prawnych wskazanych wyżej i wyłącznie w celu dostosowanym do danej podstawy.</p>
                            <p>7. Państwa dane osobowe będą przetwarzane wyłącznie przez czas niezbędny do realizacji celu, dla którego zostały zebrane, zgodnie z obowiązującymi przepisami prawa. Okres przechowywania danych zależy od rodzaju danych i podstawy prawnej przetwarzania:
                                <br />a) Dane niezbędne do realizacji umowy i wystawienia faktury będą przechowywane przez okres niezbędny do wykonania umowy oraz przez czas wymagany przepisami prawa, w tym ustawą o rachunkowości (zwykle 5 lat od zakończenia roku obrotowego, w którym wystawiono fakturę),
                                <br />b) Dane przetwarzane na podstawie zgody (np. w celach marketingowych, newsletter) będą przechowywane do momentu cofnięcia zgody przez Użytkownika.
                                <br />c) Dane przetwarzane w oparciu o prawnie uzasadniony interes Administratora (np. w celach dochodzenia roszczeń lub statystyki) będą przechowywane do momentu wygaśnięcia tego interesu.
                                <br />d) Logi systemowe i dane analityczne dotyczące korzystania ze Sklepu Internetowego (np. ruch na stronie, pliki cookies) będą przechowywane przez okres do 12 miesięcy, chyba że zostaną wcześniej usunięte przez Użytkownika.
                            </p>
                            <p>8. Administrator będzie przekazywał Państwa dane wyłącznie współpracującym z nim firmom kurierskim, a także podmiotom, z którymi współpracuje przy realizacji procesu płatności i rozliczeń oraz podmiotom, z którymi współpracuje przy utrzymaniu i obsłudze strony internetowej Sklepu Internetowego, w tym wysyłania spersonalizowanych i automatycznych komunikatów za pomocą email, SMS i innych kanałów. Dane mogą być także przekazane umocowanym pełnomocnikom.</p>
                            <p>9. Administrator nie zamierza przekazywać Państwa danych do państwa trzeciego ani do organizacji międzynarodowych.</p>
                            <p>10. Każdy Klient, który przekazuje swoje dane osobowe w związku z korzystaniem ze Sklepu Internetowego ma prawo dostępu do treści swoich danych oraz ich sprostowania, przenoszenia i usunięcia, a także prawo do ograniczenia przetwarzania danych. W celu skorzystania ze swoich praw, Klient może wysłać żądanie na adres e-mail: kontakt@zozoapp.pl lub listownie na adres siedziby Administratora: ul. Ogrodnicza 13, 62-006 Janikowo. Administrator zobowiązuje się odpowiedzieć na każde żądanie w terminie jednego miesiąca od jego otrzymania. W przypadku złożenia szczególnie skomplikowanego wniosku lub licznych żądań, termin ten może zostać przedłużony o kolejne dwa miesiące, o czym Administrator poinformuje Klienta przed upływem pierwotnego terminu wraz z uzasadnieniem opóźnienia. W związku z przetwarzaniem Państwa danych osobowych przez Administratora przysługuje Państwu prawo wniesienia skargi do organu nadzorczego tj. Prezesa Urzędu Ochrony Danych Osobowych (PUODO).</p>
                            <p>11. W oparciu o Państwa dane osobowe Administrator nie będzie podejmował wobec Państwa zautomatyzowanych decyzji, w tym decyzji będących wynikiem profilowania. Niemniej jednak Administrator korzysta z plików cookies oraz innych systemów rejestrujących ruch na naszych stronach internetowych.</p>
                            <p>12. Każdy Klient może odwołać swoją zgodę na przetwarzanie danych do celów marketingowych w dowolnym momencie, np. wysyłając e-mail na adres: kontakt@zozoapp.pl lub w sposób analogiczny do sposobu, w jaki udzielił zgody na przetwarzanie danych osobowych do celów marketingowych. Wolę cofnięcia zgody możecie Państwo wyrazić w dowolny sposób, jedynym warunkiem jest, aby dotarła ona do naszej wiadomości.</p>
                            <p>13. W przypadku skorzystania przez Klienta z płatności elektronicznych wszelkie dane podane po przejściu na stronę operatora płatności pozostają wyłącznie w jego bazie i nie są w żaden sposób dostępne lub przechowywane przez Sklep Internetowy.</p>
                            <p>14. Administrator gromadzi informacje dotyczące interakcji ze Sklepem Internetowym i usługami w tym: informacje dotyczące komputera i logowania tzw. logi systemowe zawierające datę, czas wizyty i nr IP komputera, z którego nastąpiło połączenie oraz dane na temat statystyki oglądalności stron, ruchu do i z poszczególnych witryn. Powyższe działania mają na celu udoskonalenie Sklepu Internetowego oraz dostosowywania go do potrzeb Klienta.</p>
                            <p>15. Wysyłanie marketingu bezpośredniego drogą e-mail i SMS wymaga zgody zgodnie z ustawą Prawo telekomunikacyjne (art. 172).</p>
                        </div>
                    </section>

                    <section>
                        <h3 className="text-lg font-semibold">II. OCHRONA DANYCH OSOBOWYCH KLIENTÓW</h3>
                        <div className="space-y-2">
                            <p>Administrator wdrożył rozwiązania przyjęte w polityce ochrony danych osobowych i instrukcji zarządzania systemem informatycznym służącym do przetwarzania danych osobowych, które zapewniają skuteczną ochronę danych osobowych Klientów. Najważniejsze elementy systemu ochrony danych osobowych:</p>
                            <p>1. Certyfikat SSL.</p>
                            <p>2. Zgromadzone zbiory danych osobowych chronione są przez Administratora danych osobowych zgodnie z przepisami o ochronie danych osobowych, w szczególności z Rozporządzeniem Parlamentu Europejskiego i Rady (UE) 2016/679 z dnia 27 kwietnia 2016 r. w sprawie ochrony osób fizycznych w związku z przetwarzaniem danych osobowych i w sprawie swobodnego przepływu takich danych oraz uchylenia dyrektywy 95/46/WE (określane popularnie jako „RODO”). Dostęp do danych osobowych mają tylko upoważnieni pracownicy Administratora danych osobowych, którzy są zobowiązani do zachowania uzyskanych informacji w ścisłej tajemnicy.</p>
                            <p>3. Administrator danych osobowych nie udostępnia danych osobowych zgromadzonych w związku z korzystaniem przez Klientów ze Sklepu Internetowego osobom trzecim z wyjątkiem podmiotów świadczących usługi na rzecz Administratora na podstawie odrębnych umów lub za zgodą osób, których dane są przekazywane. W tym przypadku osoba trzecia jest zobowiązana w umowie do zapewnienia poziomu bezpieczeństwa przekazanych danych osobowych na poziomie nie niższym niż obowiązuje u Administratora. W szczególnych sytuacjach, w których obowiązujące prawo nakazuje Administratorowi udostępnienie zgromadzonych danych organom państwowym, będą one udostępnione.</p>
                            <p>4. System IT Sklepu Internetowego spełnia najwyższe standardy ochrony danych osobowych. Zastosowano środki techniczne i organizacyjne zapewniające ochronę przetwarzanych danych zgodne z wymaganiami określonymi w przepisach o ochronie danych osobowych oraz wytycznymi organu ds. ochrony danych osobowych. Administrator dopełnił wszelkich prawem przewidzianych obowiązków w zakresie ochrony danych osobowych.</p>
                        </div>
                    </section>

                    <section>
                        <h3 className="text-lg font-semibold">III. COOKIES</h3>
                        <div className="space-y-2">
                            <p>1. Pliki Cookies (ciasteczka) są to niewielkie informacje tekstowe w postaci plików tekstowych, wysyłane przez serwer i zapisywane po stronie użytkownika odwiedzającego stronę Sklepu Internetowego (np. na dysku twardym komputera, laptopa, czy też na karcie pamięci smartfona – w zależności, z jakiego urządzenia korzystasz odwiedzając Sklep Internetowy).</p>
                            <p>2. Informacje zawarte w plikach Cookies zbieramy w celu zapewnienia wysokiej jakości obsługi informacyjnej prowadzonej w sieci Internet. Jeśli Klient tego nie chce, może zmienić odpowiednie ustawienia w swojej przeglądarce i wyłączyć możliwość przyjmowania ciasteczek.</p>
                            <p>3. Utworzenie pliku Cookie w żaden sposób nie narusza prywatności Klienta. Informacje w nim zawarte mogą zostać wykorzystane jedynie przez naszą stronę internetową. Wyłączenie obsługi plików Cookie nie wpływa negatywnie na zawartość lub działanie naszych stron.</p>
                            <p>4. Klient może skasować pliki Cookies ze swojego urządzenia po zakończeniu korzystania ze Sklepu Internetowego. Informację o tym, jak to zrobić można znaleźć w plikach pomocy przeglądarki internetowej, z której Klient korzysta.</p>
                            <p>5. Szczegółowe informacje na temat zmiany ustawień dotyczących plików Cookies oraz ich samodzielnego usuwania w najpopularniejszych przeglądarkach internetowych dostępne są w dziale pomocy przeglądarki internetowej, oraz na poniższych stronach:
                                <br />- <a href="https://support.google.com/chrome/answer/95647?hl=pl" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">w przeglądarce Chrome</a>
                                <br />- <a href="https://support.mozilla.org/pl/kb/wzmocniona-ochrona-przed-sledzeniem-firefox-desktop?redirectslug=W%C5%82%C4%85czanie+i+wy%C5%82%C4%85czanie+obs%C5%82ugi+ciasteczek&redirectlocale=pl" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">w przeglądarce Firefox</a>
                                <br />- <a href="https://support.microsoft.com/pl-pl/windows/usuwanie-plik%C3%B3w-cookie-i-zarz%C4%85dzanie-nimi-168dab11-0753-043d-7c16-ede5947fc64d" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">w przeglądarce Internet Explorer</a>
                                <br />- <a href="https://help.opera.com/pl/latest/web-preferences/#cookies" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">w przeglądarce Opera</a>
                                <br />- <a href="https://support.apple.com/pl-pl/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">w przeglądarce Safari</a>
                            </p>
                            <p>6. Sklep Internetowy korzysta z plików cookies, które można podzielić na następujące kategorie:
                                <br />a) Niezbędne cookies – zapewniają prawidłowe funkcjonowanie strony, np. zapamiętanie zawartości koszyka lub ustawień sesji. Okres przechowywania: do zakończenia sesji przeglądarki lub do 12 miesięcy.
                                <br />b) Cookies analityczne/statystyczne – zbierają informacje o sposobie korzystania ze Sklepu Internetowego (np. liczba odwiedzin, najczęściej odwiedzane podstrony) w celu ulepszania jakości usług. Okres przechowywania: maksymalnie 24 miesiące.
                                <br />c) Cookies marketingowe/reklamowe – umożliwiają wyświetlanie spersonalizowanych reklam oraz komunikatów marketingowych, również w serwisach zewnętrznych. Okres przechowywania: maksymalnie 12 miesięcy.
                            </p>
                            <p>7. Klient może w każdej chwili zmienić ustawienia przeglądarki w celu ograniczenia lub całkowitego wyłączenia obsługi cookies. Wyłączenie cookies może wpłynąć na niektóre funkcje Sklepu Internetowego, np. niemożność zapamiętania danych logowania lub zawartości koszyka.</p>
                        </div>
                    </section>

                    <section>
                        <h3 className="text-lg font-semibold">IV. PRAWO DO DOSTĘPU, MODYFIKACJI, PRZENOSZENIA, OGRANICZENIA PRZETWARZANIA I USUWANIA DANYCH</h3>
                        <div className="space-y-2">
                            <p>1. Każdemu Klientowi przekazującemu dane osobowe, Administrator gwarantuje prawo dostępu, modyfikacji, przenoszenia i usuwania tych danych, a także ograniczania przetwarzania. W przypadku serwisów obsługiwanych automatycznie, działania te może wykonać sam Klient, w przypadku gdy nie została udostępniona taka forma wówczas można tego dokonać kontaktując się z Administratorem na adres poczty elektronicznej: kontakt@zozoapp.pl</p>
                            <p>2. W przypadku żądania usunięcia danych osobowych, dane osobowe Klienta zostaną usunięte lub poddane anonimizacji, chyba że dalsze przetwarzanie danych będzie uzasadnione powszechnie obowiązującymi przepisami prawa.</p>
                        </div>
                    </section>

                    <section>
                        <h3 className="text-lg font-semibold">V. ZMIANA POLITYKI PRYWATNOŚCI SKLEPU INTERNETOWEGO</h3>
                        <p>Administrator zastrzega sobie prawo zmiany niniejszej polityki prywatności, o ile będzie wymagać tego obowiązujące prawo lub ulegną zmianie warunki technologiczne funkcjonowania Sklepu Internetowego. Aktualny tekst polityki prywatności zawsze znajduje się na stronie Sklepu Internetowego. Zmiany polityki prywatności nie mogą pozbawiać Państwa praw nabytych i odnoszą one skutek na przyszłość, od daty wprowadzenia zmiany. Klient, który nie będzie zgadzał się na zmiany polityki prywatności może w każdej chwili zaprzestać korzystania ze Sklepu Internetowego.</p>
                    </section>

                    <section>
                        <h3 className="text-lg font-semibold">VI. KONTAKT</h3>
                        <p>W przypadku pytań lub wątpliwości związanych z ochroną danych osobowych w związku z korzystaniem ze Sklepu Internetowego można się skontaktować z Administratorem pod adresem: ul. Ogrodnicza 13, 62-006 Janikowo lub adresem poczty elektronicznej: kontakt@zozoapp.pl</p>
                    </section>

                </CardContent>
            </Card>
        </div>
    );
}
