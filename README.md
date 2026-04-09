# SGCJ-Gabon — MVP complet

**Système de Gestion du Casier Judiciaire — République Gabonaise**
Projet porté par **Esno Poly Services** à destination du Ministère de la Justice du Gabon.

> ⚠️ **MVP de démonstration uniquement.** Données simulées, persistance locale via `localStorage`, aucun backend. Destiné à la présentation à la Direction Générale.

---

## ✅ Fonctionnalités livrées

### Parcours citoyen
- Inscription libre avec génération automatique d'un numéro d'identification national (`GA-YYYY-NNNNNN`)
- Tableau de bord avec dossier d'identité et suivi des demandes
- Soumission d'une demande de Bulletin n°3 (motif + confirmation des pièces justificatives)
- Paiement simulé sur 6 canaux : Airtel Money, Moov Money, Visa, Mastercard, PayPal, Apple Pay

### Parcours agent casier
- File des demandes payées à traiter
- **Génération du Bulletin n°3 officiel en PDF** (format A4) avec :
  - En-tête République Gabonaise / Ministère de la Justice
  - Bloc identité du demandeur
  - Liste des condamnations validées (ou mention « — NÉANT — » si aucune)
  - **QR Code anti-fraude** pointant vers la page publique de vérification
  - Code de vérification alphanumérique
- Téléchargement automatique du PDF

### Parcours superviseur casier
- Vue consolidée de toutes les demandes du service
- Statistiques (en attente de paiement, à traiter, délivrés)

### Parcours agent pénitentiaire
- Recherche d'un citoyen par son numéro national
- Consultation des condamnations déjà enregistrées sur le dossier
- Saisie d'une nouvelle condamnation (juridiction, date, infraction, peine)
- La saisie entre en file d'attente de validation

### Parcours superviseur des condamnations
- File des condamnations en attente
- Validation ou rejet avec motif
- Les condamnations **validées** apparaissent automatiquement sur les bulletins générés ensuite

### Parcours Directeur Général
- Tableau de bord avec KPI (citoyens, demandes, bulletins délivrés, revenus)
- Répartition visuelle par statut (demandes et condamnations)
- Délai moyen de traitement
- **Journal d'audit global immuable** consultable en temps réel

### Parcours administrateur technique
- Liste de tous les comptes enregistrés
- Création de comptes agents avec choix du rôle

### Vérification publique (sans authentification)
- Page `/verifier/:code` accessible par scan du QR code
- Affiche l'authentification du document avec les informations minimales nécessaires

### Socle transverse
- **Clean Architecture** (domain / application / infrastructure / ui)
- **RBAC** complet sur les 7 rôles avec permissions granulaires
- **Journal d'audit immuable** qui trace chaque action (connexion, soumission, paiement, génération, validation…)
- **Persistance locale** — les données survivent aux rechargements, tout reste dans le navigateur
- **Routing protégé** — chaque URL filtrée par rôle
- Déploiement **GitHub Pages** préconfiguré

---

## 👥 Comptes de démonstration

| Rôle                            | Email                                    |
|----------------------------------|------------------------------------------|
| Citoyen                          | `citoyen@demo.ga`                        |
| Agent du casier judiciaire       | `agent.casier@justice.ga`                |
| Superviseur du casier            | `superviseur.casier@justice.ga`          |
| Directeur Général                | `dg@justice.ga`                          |
| Agent pénitentiaire              | `agent.penitentiaire@justice.ga`         |
| Superviseur des condamnations    | `superviseur.condamnations@justice.ga`   |
| Administrateur technique         | `admin@justice.ga`                       |

**Mot de passe unique pour tous les comptes démo :** `demo2026`

---

## 🚀 Démarrage rapide

```bash
npm install
npm run dev
```
Ouvre `http://localhost:5173/sgcj-gabon-mvp/`.

---

## 🎬 Scénario de démo recommandé (parcours complet de bout en bout)

Ce scénario illustre la cohérence entre tous les rôles. Compte 10 minutes pour tout parcourir.

### 1. Inscription et demande côté citoyen
1. Clique **« Créer un compte citoyen »** et remplis le formulaire — note le numéro `GA-2026-NNNNNN` généré, il servira plus tard
2. Depuis le tableau de bord citoyen, clique **« + Nouvelle demande »** → choisis un motif → coche les deux pièces justificatives → soumets
3. Sur l'écran de paiement, choisis Airtel Money → **Payer** → attends 2 secondes → redirection automatique
4. La demande apparaît maintenant au statut « En cours de traitement »

### 2. Saisie d'une condamnation (optionnel — pour tester le cas « NÉANT » saute cette étape)
5. Déconnecte-toi, reconnecte-toi comme **Agent pénitentiaire** (`agent.penitentiaire@justice.ga`)
6. Colle le numéro `GA-2026-NNNNNN` du citoyen → **Rechercher**
7. Remplis une condamnation de test (ex. : Tribunal de Libreville, vol simple, 6 mois avec sursis) → **Soumettre**

### 3. Validation par le superviseur condamnations
8. Déconnecte-toi, reconnecte-toi comme **Superviseur des condamnations**
9. La condamnation apparaît dans la file → clique **✓ Valider**

### 4. Traitement par l'agent casier
10. Déconnecte-toi, reconnecte-toi comme **Agent du casier**
11. La demande payée du citoyen est dans la file → clique **« Générer le bulletin »**
12. Un **PDF se télécharge automatiquement** — ouvre-le :
    - Il contient l'identité du citoyen
    - La condamnation validée (ou « — NÉANT — » si étapes 5-9 sautées)
    - Un QR code en bas à droite
    - Un code de vérification

### 5. Vérification par un tiers
13. Scanne le QR code avec ton téléphone **OU** copie l'URL encodée dans le code
14. Tu atterris sur une page publique `/verifier/CODE` qui confirme l'authenticité

### 6. Vue DG
15. Déconnecte-toi, reconnecte-toi comme **Directeur Général**
16. Tu vois : le nombre de citoyens, les revenus générés (5000 FCFA par bulletin délivré), la répartition, et **le journal d'audit complet** avec toutes les actions effectuées pendant la démo

### 7. Administration
17. Déconnecte-toi, reconnecte-toi comme **Administrateur technique**
18. Tu vois la liste des comptes (y compris le citoyen que tu as créé) et tu peux créer un nouveau compte agent

---

## 🌐 Déploiement GitHub Pages

1. **Crée un repo GitHub**, par exemple `sgcj-gabon-mvp`
2. Si le nom diffère, ajuste `base: '/sgcj-gabon-mvp/'` dans `vite.config.ts`
3. Pousse le code :
   ```bash
   git init
   git add .
   git commit -m "MVP complet SGCJ-Gabon"
   git branch -M main
   git remote add origin https://github.com/<ton-user>/sgcj-gabon-mvp.git
   git push -u origin main
   ```
4. Déploie :
   ```bash
   npm run deploy
   ```
5. Active GitHub Pages : Settings → Pages → Branch `gh-pages` / root

Site accessible sur `https://<ton-user>.github.io/sgcj-gabon-mvp/`.

---

## 🏗️ Architecture

```
src/
├── domain/                        # Cœur métier pur
│   ├── entities/                  # User, Role, Citizen, Bulletin, Conviction, AuditLog
│   └── value-objects/             # NationalId
│
├── application/                   # Cas d'usage & ports
│   ├── ports/
│   │   ├── AuthRepository.ts
│   │   ├── UserRepository.ts
│   │   ├── AuditRepository.ts
│   │   ├── CitizenRepository.ts
│   │   ├── BulletinRepository.ts
│   │   └── ConvictionRepository.ts
│   └── use-cases/
│       ├── auth/                  # Login, Logout
│       ├── citizen/               # RegisterCitizen
│       ├── bulletin/              # Submit, Pay, ListCitizen, ListPending, Process, Verify
│       ├── conviction/            # Submit, Validate, ListPending
│       ├── dashboard/             # GetGlobalDashboard
│       └── admin/                 # CreateAgent
│
├── infrastructure/                # Implémentations concrètes
│   ├── persistence/               # LocalStorageAdapter
│   ├── repositories/              # InMemory* (Auth, Audit, Citizen, Bulletin, Conviction)
│   ├── pdf/                       # BulletinPdfGenerator (jspdf + qrcode)
│   ├── seed/                      # seedUsers.ts
│   └── container.ts               # Composition root
│
└── ui/                            # React, Tailwind
    ├── contexts/                  # AuthContext
    ├── components/                # Layout, ProtectedRoute
    ├── lib/                       # format helpers
    ├── pages/
    │   ├── LoginPage.tsx
    │   ├── citizen/
    │   ├── agent-casier/
    │   ├── superviseur-casier/
    │   ├── agent-penitentiaire/
    │   ├── superviseur-condamnations/
    │   ├── dg/
    │   ├── admin/
    │   └── public/                # PublicVerifyPage
    └── router/                    # AppRouter
```

**Règle Clean Architecture :** les dépendances pointent vers l'intérieur.
- `domain` ne dépend de rien
- `application` dépend uniquement de `domain`
- `infrastructure` dépend de `application` et `domain`
- `ui` dépend de tout via le `container`

Le jour où on remplacera `localStorage` par un vrai backend REST, aucune ligne du domaine ni des use cases ne bougera. Seules les implémentations d'`infrastructure/repositories` changeront.

---

## 🧹 Remettre à zéro les données

```js
Object.keys(localStorage)
  .filter(k => k.startsWith('sgcj_gabon_mvp:'))
  .forEach(k => localStorage.removeItem(k));
location.reload();
```

---

*Esno Poly Services — Avril 2026*
