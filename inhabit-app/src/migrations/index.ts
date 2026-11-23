import * as migration_20261113_103247_initial from './20261113_103247_initial';
import * as migration_20261115_120818_media_alt_facultatif from './20261115_120818_media_alt_facultatif';
import * as migration_20261123_002425_paiements_en_ligne from './20261123_002425_paiements_en_ligne';

export const migrations = [
  {
    up: migration_20261113_103247_initial.up,
    down: migration_20261113_103247_initial.down,
    name: '20261113_103247_initial',
  },
  {
    up: migration_20261115_120818_media_alt_facultatif.up,
    down: migration_20261115_120818_media_alt_facultatif.down,
    name: '20261115_120818_media_alt_facultatif',
  },
  {
    up: migration_20261123_002425_paiements_en_ligne.up,
    down: migration_20261123_002425_paiements_en_ligne.down,
    name: '20261123_002425_paiements_en_ligne'
  },
];
