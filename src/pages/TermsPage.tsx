import React from 'react';
import { FileText, ChevronLeft } from 'lucide-react';
import { useNavigation } from '../contexts/NavigationContext';

export function TermsPage() {
  const { navigate } = useNavigation();

  return (
    <div className="max-w-2xl mx-auto pb-16">
      <button
        onClick={() => navigate('home')}
        className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
      >
        <ChevronLeft size={18} />
        Tilbage til forsiden
      </button>

      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-gray-800 flex items-center justify-center">
          <FileText size={20} className="text-gray-300" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Vilkår og betingelser</h1>
          <p className="text-gray-500 text-sm">Senest opdateret: {new Date().toLocaleDateString('da-DK', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
      </div>

      <div className="space-y-8 text-gray-300 text-sm leading-relaxed">
        <TermsSection title="1. Accept af vilkår">
          <p>
            Ved at oprette en konto og bruge Tempted accepterer du disse vilkår og betingelser i deres helhed.
            Hvis du ikke accepterer alle vilkår, bedes du undlade at bruge platformen.
          </p>
        </TermsSection>

        <TermsSection title="2. Tjenestens formål">
          <p>
            Tempted er en online datingplatform designet til at hjælpe voksne med at møde andre mennesker socialt og romantisk.
            Platformen er forbeholdt personer over 18 år.
          </p>
        </TermsSection>

        <TermsSection title="3. Brugeransvar og adfærd">
          <p className="mb-3">
            Som bruger af Tempted forpligter du dig til at:
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-gray-400 ml-2">
            <li>Oprette og vedligeholde en ærlig og sandfærdig profil</li>
            <li>Behandle alle andre brugere med respekt og høflighed</li>
            <li>Ikke sende uopfordrede, stødende eller upassende indhold</li>
            <li>Ikke misbruge platformen til kommercielle formål eller spam</li>
            <li>Ikke udgive dig for at være en anden person</li>
            <li>Overholde gældende dansk lovgivning</li>
          </ul>
        </TermsSection>

        <TermsSection title="4. Indhold og billeder">
          <p>
            Du er ansvarlig for alt indhold du uploader til Tempted, herunder profilbilleder og beskeder.
            Indhold der er seksuelt eksplicit, hadefuldt, diskriminerende eller på anden måde ulovligt er
            strengt forbudt og vil medføre øjeblikkelig lukning af kontoen.
          </p>
          <p className="mt-3">
            Alle billeder gennemgår en godkendelsesproces inden de vises offentligt på platformen.
          </p>
        </TermsSection>

        <TermsSection title="5. Privatliv og personoplysninger">
          <p>
            Vi behandler dine personoplysninger i overensstemmelse med den danske persondatalov og GDPR.
            Dine oplysninger bruges udelukkende til at drive tjenesten og forbedre din oplevelse.
            Vi deler aldrig dine persondata med tredjeparter uden dit udtrykkelige samtykke.
          </p>
        </TermsSection>

        <TermsSection title="6. Membership og betaling">
          <p>
            Tempted tilbyder gratis basisadgang samt betalte membership-niveauer (Basic og Premium) med
            udvidede funktioner. Betaling sker forud for den valgte periode. Fortrydelsesretten er 14 dage
            fra købstidspunktet, med mindre tjenesten allerede er påbegyndt.
          </p>
        </TermsSection>

        <TermsSection title="7. Kontoopsigelse">
          <p>
            Du kan til enhver tid slette din konto. Vi forbeholder os retten til at suspendere eller
            lukke konti, der overtræder disse vilkår, uden forudgående varsel.
          </p>
        </TermsSection>

        <TermsSection title="8. Ansvarsfraskrivelse">
          <p>
            Tempted er en platform for kommunikation mellem brugere. Vi er ikke ansvarlige for indhold
            skabt af brugere eller for hændelser, der opstår som følge af møder arrangeret via platformen.
            Vi anbefaler altid at første møde finder sted på et offentligt sted.
          </p>
        </TermsSection>

        <TermsSection title="9. Ændringer i vilkår">
          <p>
            Vi forbeholder os retten til at ændre disse vilkår med minimum 14 dages varsel.
            Fortsætter du med at bruge Tempted efter ikrafttræden af nye vilkår, betragtes det som
            accept af de opdaterede vilkår.
          </p>
        </TermsSection>

        <TermsSection title="10. Kontakt">
          <p>
            Har du spørgsmål til disse vilkår, er du velkommen til at kontakte os via
            beskedfunktionen eller på vores supportkanaler.
          </p>
        </TermsSection>

        <div className="pt-4 border-t border-gray-800">
          <p className="text-gray-600 text-xs">
            Disse vilkår er underlagt dansk ret. Eventuelle tvister afgøres ved de danske domstole.
          </p>
        </div>
      </div>
    </div>
  );
}

function TermsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-white font-semibold text-base mb-3 pb-2 border-b border-gray-800/80">{title}</h2>
      <div className="text-gray-400 leading-relaxed">{children}</div>
    </div>
  );
}
