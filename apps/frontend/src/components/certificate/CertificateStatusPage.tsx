import { Button, Card, Container, Footer, Header, Breadcrumbs } from '../index';
import { Heading, Text } from '../ui/Typography';

export function CertificateLoadingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 flex items-center justify-center">
        <p className="text-on-surface-variant">Preparing certificate...</p>
      </main>
      <Footer />
    </div>
  );
}

export function CertificateUnavailablePage({
  breadcrumbs,
  onBackToCourse,
}: {
  breadcrumbs: Array<{ label: string; path?: string }>;
  onBackToCourse: () => void;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <Breadcrumbs items={breadcrumbs} />
      <main className="flex-1">
        <Container className="py-section-gap">
          <Card className="p-8 text-center border border-outline-variant">
            <Heading level="h1" size="headline-lg" className="mb-3">
              Certificate unavailable
            </Heading>
            <Text variant="body-md" color="on-surface-variant" className="mb-6">
              Complete every lesson and pass the final test before downloading your certificate.
            </Text>
            <Button onClick={onBackToCourse}>
              Back to Course
            </Button>
          </Card>
        </Container>
      </main>
      <Footer />
    </div>
  );
}
