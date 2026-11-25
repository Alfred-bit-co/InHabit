import * as migration_20261113_103247_initial from './20261113_103247_initial';
import * as migration_20261115_120818_media_alt_facultatif from './20261115_120818_media_alt_facultatif';
import * as migration_20261123_004525_espace_membre_paiements from './20261123_004525_espace_membre_paiements';
import * as migration_20261123_142007_membres_google from './20261123_142007_membres_google';
import * as migration_20261125_011159_page_produits from './20261125_011159_page_produits';

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
    up: migration_20261123_004525_espace_membre_paiements.up,
    down: migration_20261123_004525_espace_membre_paiements.down,
    name: '20261123_004525_espace_membre_paiements',
  },
  {
    up: migration_20261123_142007_membres_google.up,
    down: migration_20261123_142007_membres_google.down,
    name: '20261123_142007_membres_google',
  },
  {
    up: migration_20261125_011159_page_produits.up,
    down: migration_20261125_011159_page_produits.down,
    name: '20261125_011159_page_produits'
  },
];
