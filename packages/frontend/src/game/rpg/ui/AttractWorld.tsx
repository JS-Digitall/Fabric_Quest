import { useMemo } from 'react';

import { chapters } from '../../content';
import { livingCreatures, newCampaign } from '../campaign';
import { createBus } from '../phaser/bus';
import { PhaserGame } from '../phaser/PhaserGame';

/** The live world as a slow fly-over behind the title and menus. */
export function AttractWorld() {
  const bus = useMemo(() => createBus(), []);
  const creatures = useMemo(
    () => livingCreatures(newCampaign('practitioner'), chapters),
    []
  );
  return (
    <div className="absolute inset-0" aria-hidden>
      <PhaserGame
        bus={bus}
        creatures={creatures}
        openedChests={[]}
        defeatedBosses={[]}
        mode="attract"
      />
    </div>
  );
}
