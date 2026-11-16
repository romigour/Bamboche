<script lang="ts">
  import type { Snippet } from 'svelte';
  import { soundOn, tap } from '../lib/feedback';
  import { addPlayer, players, removePlayer, renamePlayer } from '../lib/players';
  import Icon from '../lib/ui/Icon.svelte';
  import IconButton from '../lib/ui/IconButton.svelte';
  import Switch from '../lib/ui/Switch.svelte';
  import { checkForUpdate, updateStatus } from '../lib/update';
  import { versionLabel } from '../lib/version';

  let { onback, extra }: { onback: () => void; extra?: Snippet } = $props();

  const AVATAR = ['blindtest', 'hipster', 'pop', 'undercover', 'timeup', 'ok'];

  let draft = $state('');
  let editingId = $state<string | null>(null);
  let editName = $state('');
  let input: HTMLInputElement | undefined = $state();

  function add(e?: Event) {
    e?.preventDefault();
    if (addPlayer(draft)) {
      tap();
      draft = '';
    }
    input?.focus();
  }
  function startEdit(id: string, name: string) {
    tap();
    editingId = id;
    editName = name;
  }
  function confirmEdit(e?: Event) {
    e?.preventDefault();
    if (editingId && renamePlayer(editingId, editName)) {
      tap();
      editingId = null;
    }
  }
  const UPDATE_MESSAGES: Partial<Record<typeof $updateStatus, string>> = {
    unsupported: 'Indisponible',
    checking: 'Recherche…',
    upToDate: 'Bamboche est à jour',
    offline: 'Pas de connexion',
    error: 'Impossible de vérifier',
  };
  const updateMessage = $derived(UPDATE_MESSAGES[$updateStatus] ?? versionLabel());

  function focusOnMount(node: HTMLInputElement) {
    node.focus();
    node.select();
  }
</script>

<div class="page">
  <div class="head">
    <IconButton icon="back" label="Retour" onclick={onback} />
    <h1>Réglages</h1>
  </div>

  <section>
    <div class="label">Joueurs de la soirée · {$players.length}</div>
    <form class="add" onsubmit={add}>
      <label for="nouveau" class="sr">Nom du joueur</label>
      <input
        id="nouveau"
        bind:this={input}
        bind:value={draft}
        type="text"
        placeholder="Ajouter un joueur"
        maxlength="24"
        autocomplete="off"
        enterkeyhint="done"
      />
      <button type="submit" class="addbtn" aria-label="Ajouter" disabled={!draft.trim()}><Icon name="plus" size={26} stroke={3} /></button>
    </form>
  </section>

  <ul class="list">
    {#each $players as p, i (p.id)}
      <li class:editing={editingId === p.id}>
        <span class="av" style:background="var(--{AVATAR[i % AVATAR.length]})">{p.name.charAt(0).toUpperCase()}</span>
        {#if editingId === p.id}
          <form class="edit" onsubmit={confirmEdit}>
            <label for="renommer" class="sr">Nouveau nom</label>
            <input id="renommer" type="text" bind:value={editName} maxlength="24" use:focusOnMount enterkeyhint="done" />
            <button type="submit" class="ok" aria-label="Valider le nom" disabled={!editName.trim()}><Icon name="check" size={24} stroke={3} /></button>
          </form>
        {:else}
          <span class="name">{p.name}</span>
          <button type="button" class="ghost" aria-label="Renommer {p.name}" onclick={() => startEdit(p.id, p.name)}><Icon name="edit" size={22} /></button>
          <button
            type="button"
            class="ghost ko"
            aria-label="Supprimer {p.name}"
            onclick={() => {
              tap();
              removePlayer(p.id);
            }}><Icon name="trash" size={22} /></button
          >
        {/if}
      </li>
    {:else}
      <li class="empty">Ajoute les joueurs de la soirée : ils serviront pour former les équipes.</li>
    {/each}
  </ul>

  <section>
    <div class="label">Préférences</div>
    <Switch checked={$soundOn} label="Sons et vibrations" onchange={(v) => soundOn.set(v)}>
      {#snippet icon()}<span class="pref-icon"><Icon name={$soundOn ? 'volume' : 'volumeoff'} size={24} /></span>{/snippet}
    </Switch>
    <button
      type="button"
      class="pref update"
      aria-labelledby="maj-libelle"
      aria-describedby="maj-etat"
      disabled={$updateStatus === 'checking' || $updateStatus === 'unsupported'}
      onclick={() => {
        tap();
        checkForUpdate();
      }}
    >
      <span class="pref-icon"><Icon name="refresh" size={24} /></span>
      <span class="update-text">
        <span class="update-label" id="maj-libelle">{$updateStatus === 'available' ? 'Installer la mise à jour' : 'Rechercher une mise à jour'}</span>
        <span class="update-msg" id="maj-etat" aria-live="polite">{updateMessage}</span>
      </span>
    </button>
  </section>

  {#if extra}{@render extra()}{/if}
</div>

<style>
  .page {
    flex: 1;
    min-height: 100dvh;
    padding: calc(24px + env(safe-area-inset-top)) 20px calc(28px + env(safe-area-inset-bottom));
    display: flex;
    flex-direction: column;
    gap: 18px;
  }
  .head { display: flex; align-items: center; gap: 14px; }
  h1 { font-size: 32px; }
  section { display: flex; flex-direction: column; gap: 10px; }
  .label { font-size: 13px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; color: var(--texte-doux); }
  .sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
  .add { display: flex; gap: 10px; }
  .add input {
    flex-grow: 1;
    min-width: 0;
    height: 56px;
    border-radius: 18px;
    border: 3px solid var(--surface-plus);
    background: var(--surface);
    color: var(--texte);
    padding: 0 16px;
    font-weight: 700;
    font-size: 17px;
    outline: none;
  }
  .add input:focus { border-color: var(--ligne); }
  input::placeholder { color: #8c80b8; }
  .addbtn {
    width: 56px;
    height: 56px;
    border-radius: 18px;
    background: var(--pop);
    color: var(--nuit);
    box-shadow: 0 5px 0 var(--pop-ombre);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .addbtn:active:not(:disabled) { transform: translateY(4px); box-shadow: 0 1px 0 var(--pop-ombre); }
  .addbtn:disabled { opacity: 0.45; }
  .list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; flex-grow: 1; }
  li {
    display: flex;
    align-items: center;
    gap: 12px;
    background: var(--surface);
    border-radius: 18px;
    padding: 8px 8px 8px 12px;
    border: 3px solid transparent;
  }
  li.editing { border-color: var(--pop); padding: 8px; }
  li.empty { color: var(--texte-doux); font-size: 15px; padding: 16px; text-align: center; background: none; border: 3px dashed var(--ligne); }
  .av {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    color: var(--nuit);
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .name { flex-grow: 1; font-family: var(--font-display); font-weight: 600; font-size: 19px; overflow: hidden; text-overflow: ellipsis; }
  .ghost { width: 44px; height: 44px; border-radius: 14px; color: var(--texte-doux); display: flex; align-items: center; justify-content: center; }
  .ghost:active { background: var(--surface-plus); }
  .ko { color: var(--ko); }
  .edit { flex-grow: 1; display: flex; gap: 10px; min-width: 0; }
  .edit input {
    flex-grow: 1;
    min-width: 0;
    height: 44px;
    border-radius: 12px;
    border: none;
    background: var(--nuit);
    color: var(--texte);
    padding: 0 12px;
    font-family: var(--font-display);
    font-weight: 600;
    font-size: 18px;
    outline: none;
  }
  .pref { display: flex; align-items: center; gap: 12px; background: var(--surface); border-radius: 18px; padding: 12px 14px; }
  .pref-icon { color: var(--pop); display: flex; }
  .update-text { flex-grow: 1; display: flex; flex-direction: column; gap: 2px; min-width: 0; }
  .update { width: 100%; text-align: left; min-height: 60px; }
  .update:disabled { cursor: default; }
  .update:disabled .update-label { opacity: 0.6; }
  .update-label { font-family: var(--font-display); font-weight: 600; font-size: 18px; }
  .update-msg { font-size: 14px; color: var(--texte-doux); }
  .ok {
    width: 44px;
    height: 44px;
    border-radius: 14px;
    background: var(--ok);
    color: var(--nuit);
    box-shadow: 0 4px 0 var(--ok-ombre);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
</style>
