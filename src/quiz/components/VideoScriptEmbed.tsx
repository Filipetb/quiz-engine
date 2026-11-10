import { useEffect, useRef } from 'react';

import { cn } from '@/shared/utils/cn';
import type {
  ComponentProps,
  VideoScriptEmbedComponent as VideoScriptSchema,
} from '@/quiz/engine/types';

/**
 * Monta/desmonta um player (VTurb, Wistia, Vimeo etc.) seguindo PRD §8.6.
 *
 * Estratégia:
 * - `playerTag` (ou `containerId`): elemento alvo do player, criado no slot
 *   local a cada mount e removido no unmount. É o que garante que o player
 *   não duplica ao voltar/avançar.
 * - `inlineScript`: roda no slot local. Limpo no unmount.
 * - `scriptSrc`: injetado em `document.head` UMA VEZ por URL. Sobrevive a
 *   unmount — se o script define um custom element (`customElements.define`),
 *   redefinir dispara erro; mantendo-o no head, o próximo `<vturb-smartplayer>`
 *   criado é reconhecido automaticamente pelo CE já registrado.
 *
 * Limitação: listeners globais / estado em `window` adicionados pelo player
 * não são limpos (exige cooperação do provedor). Para o requisito do PRD
 * — "player não duplica ao voltar" — isolar DOM local + dedup no head basta.
 */

function findExistingScript(src: string): HTMLScriptElement | null {
  const scripts = document.head.querySelectorAll('script');
  for (const s of Array.from(scripts)) {
    if (s.src === src) return s;
  }
  return null;
}

export function VideoScriptEmbed({
  config,
}: ComponentProps<VideoScriptSchema>): JSX.Element {
  const slotRef = useRef<HTMLDivElement>(null);

  // Sentinela estável p/ o useEffect, mesmo se objetos chegarem por referência
  // nova mas com o mesmo conteúdo (schema JSON normalmente é estático).
  const signature = JSON.stringify({
    scriptSrc: config.scriptSrc,
    inlineScript: config.inlineScript,
    containerId: config.containerId,
    playerTag: config.playerTag,
    playerAttributes: config.playerAttributes,
    scriptAttributes: config.scriptAttributes,
    pitchSync: config.pitchSync,
  });

  useEffect(() => {
    const slot = slotRef.current;
    if (!slot) return;

    // 1. Player target (custom element ou div).
    if (config.playerTag) {
      const el = document.createElement(config.playerTag);
      if (config.playerAttributes) {
        for (const [k, v] of Object.entries(config.playerAttributes)) {
          el.setAttribute(k, v);
        }
      }
      slot.appendChild(el);
    } else if (config.containerId) {
      const div = document.createElement('div');
      div.id = config.containerId;
      slot.appendChild(div);
    }

    // 2. Script inline — executa dentro do slot.
    if (config.inlineScript) {
      const inline = document.createElement('script');
      inline.text = config.inlineScript;
      if (config.scriptAttributes) {
        for (const [k, v] of Object.entries(config.scriptAttributes)) {
          inline.setAttribute(k, v);
        }
      }
      slot.appendChild(inline);
    }

    // 3. Script externo — vai para document.head com dedup por URL.
    if (config.scriptSrc && !findExistingScript(config.scriptSrc)) {
      const headScript = document.createElement('script');
      headScript.src = config.scriptSrc;
      headScript.async = true;
      if (config.scriptAttributes) {
        for (const [k, v] of Object.entries(config.scriptAttributes)) {
          headScript.setAttribute(k, v);
        }
      }
      document.head.appendChild(headScript);
    }

    // 4. Pitch sync — revela elementos `.pq-pitch-hidden` no timestamp do pitch.
    //    Listener registrado em React (não em script injetado) para garantir
    //    cleanup no unmount e evitar handlers zumbis após back/forward.
    let pitchHandler: EventListener | null = null;
    if (config.pitchSync) {
      const selector = config.pitchSync.selector ?? '.pq-pitch-hidden';
      const fallbackDelay = config.pitchSync.delaySeconds;
      const variantMap = new Map<string, number>();
      (config.pitchSync.variants ?? []).forEach((v) =>
        variantMap.set(v.videoId, v.delaySeconds),
      );

      pitchHandler = ((event: Event) => {
        const detail = (event as CustomEvent).detail as
          | { config?: { id?: string }; player?: unknown }
          | undefined;
        const player = detail?.player as
          | {
              displayHiddenElements?: (
                delay: number,
                selectors: string[],
                opts?: { persist?: boolean },
              ) => void;
            }
          | undefined;
        if (!player?.displayHiddenElements) return;
        const id = detail?.config?.id;
        const delay =
          id && variantMap.has(id) ? variantMap.get(id)! : fallbackDelay;
        if (delay == null) return;
        try {
          player.displayHiddenElements(delay, [selector], { persist: true });
        } catch (err) {
          console.warn('[QuizEngine] displayHiddenElements failed', err);
        }
      }) as EventListener;
      document.addEventListener('player:ready', pitchHandler);
    }

    return () => {
      if (pitchHandler) {
        document.removeEventListener('player:ready', pitchHandler);
      }
      // Limpa só o slot local. O script em document.head persiste entre
      // mounts — isso é o que evita duplicar o custom element.
      while (slot.firstChild) slot.removeChild(slot.firstChild);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  const aspectStyle = config.aspectRatio
    ? { aspectRatio: config.aspectRatio }
    : undefined;

  return (
    <div
      ref={slotRef}
      className={cn(
        'overflow-hidden rounded-[var(--radius)] bg-black',
        config.className,
      )}
      style={aspectStyle}
    />
  );
}
