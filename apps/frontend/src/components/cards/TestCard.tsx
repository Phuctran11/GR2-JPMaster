import { Card, ImageCard, InteractiveHoverCard, LevelBadge } from '../ui';
import { Heading } from '../ui/Typography';

interface TestCardProps {
  title: string;
  level: string;
  levelColor?: string;
  type: string;
  duration: string;
  image: string;
  onStart?: () => void;
}

export function TestCard({
  title,
  level,
  type,
  duration,
  image,
  onStart,
}: TestCardProps) {
  return (
    <InteractiveHoverCard className="group h-full rounded-[2rem]" tone="warning">
      <Card className="bg-surface border border-outline-variant transition-all duration-300 flex h-full flex-col">
        <div className="p-stack-lg flex-grow flex flex-col">
          <div className="flex items-start mb-stack-md">
            <LevelBadge level={level} variant="solid" />
          </div>
          <Heading level="h3" size="headline-sm" className="text-on-surface mb-stack-sm leading-tight transition-colors group-hover:text-primary">
            {title}
          </Heading>
          <div className="flex gap-stack-sm mb-stack-lg">
            <span className="text-label-md text-on-surface-variant flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">description</span>
              {type}
            </span>
            <span className="text-label-md text-on-surface-variant flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">schedule</span>
              {duration}
            </span>
          </div>
          <div className="group -mx-1">
            <ImageCard
              src={image}
              alt={title}
              rounded="md"
              className="mb-stack-md h-44 w-full opacity-90 transition-opacity group-hover:opacity-100 [&_img]:h-full [&_img]:w-full [&_img]:object-cover"
            />
          </div>
        </div>
        <div className="px-stack-lg pb-stack-lg">
          <button
            onClick={onStart}
            className="w-full py-3 bg-primary text-on-primary font-semibold text-label-md hover:opacity-90 transition-all flex items-center justify-center gap-2"
          >
            Start Test <span className="material-symbols-outlined text-[18px]">play_arrow</span>
          </button>
        </div>
      </Card>
    </InteractiveHoverCard>
  );
}
