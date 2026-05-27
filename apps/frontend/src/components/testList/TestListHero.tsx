import { Text } from '../ui/Typography';

export function TestListHero() {
  return (
    <section className="seigaiha-pattern py-section-gap border-b border-outline-variant">
      <div className="max-w-[1280px] mx-auto px-margin-desktop">
        <div className="max-w-2xl">
          <span className="inline-block px-3 py-1 bg-primary-fixed text-on-primary-fixed text-label-md rounded mb-stack-sm">
            JLPT MOCK TESTS
          </span>
          <h1 className="font-display-lg text-display-lg text-primary mb-stack-md">JLPT Tests</h1>
          <Text variant="body-lg" color="on-surface-variant" className="leading-relaxed">
            Choose a JLPT level and section, then take a mock test generated from the exams managed by admins.
          </Text>
        </div>
      </div>
    </section>
  );
}
