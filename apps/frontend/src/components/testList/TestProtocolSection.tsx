import { Card } from '../';
import { Text } from '../ui/Typography';
import { guidelines, scoringTable } from './testListData';

export function TestProtocolSection() {
  return (
    <section className="bg-surface-container py-section-gap overflow-hidden">
      <div className="max-w-[1280px] mx-auto px-margin-desktop grid grid-cols-1 lg:grid-cols-2 gap-section-gap items-center">
        <div>
          <h2 className="font-display-lg text-headline-lg text-primary mb-stack-lg">Test Taking Protocol</h2>
          <Text variant="body-lg" color="on-surface-variant" className="mb-stack-lg">
            Follow these guidelines to make your mock test results useful for study planning.
          </Text>
          <div className="space-y-stack-md">
            {guidelines.map((guideline) => (
              <div key={guideline.number} className="flex items-start gap-stack-md">
                <span className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold flex-shrink-0">
                  {guideline.number}
                </span>
                <div>
                  <h4 className="font-headline-sm text-headline-sm text-on-surface">{guideline.title}</h4>
                  <Text variant="body-md" color="on-surface-variant">
                    {guideline.description}
                  </Text>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Card className="bg-surface p-stack-lg border border-outline-variant shadow-sm relative">
          <h3 className="font-headline-sm text-headline-sm mb-stack-md text-primary">Practice Scoring</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-outline-variant">
                  <th className="py-3 font-bold text-label-md">Level</th>
                  <th className="py-3 font-bold text-label-md">Pass Mark</th>
                  <th className="py-3 font-bold text-label-md">Max Points</th>
                </tr>
              </thead>
              <tbody>
                {scoringTable.map((row) => (
                  <tr key={row.level} className="border-b border-outline-variant/30">
                    <td className="py-3 text-body-md">{row.level}</td>
                    <td className="py-3 text-body-md">{row.passmark}</td>
                    <td className="py-3 text-body-md">{row.maxpoints}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </section>
  );
}
