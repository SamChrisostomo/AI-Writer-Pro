import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

export interface GhostTextOptions {
  suggestion: string;
}

export const ghostTextPluginKey = new PluginKey('ghostText');

export const GhostTextExtension = Extension.create<GhostTextOptions>({
  name: 'ghostText',

  addOptions() {
    return {
      suggestion: '',
    };
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: ghostTextPluginKey,
        state: {
          init() {
            return DecorationSet.empty;
          },
          apply(tr, oldState) {
            const suggestion = tr.getMeta('ghostTextSuggestion');
            
            if (suggestion === undefined) {
              return oldState.map(tr.mapping, tr.doc);
            }

            if (!suggestion) {
              return DecorationSet.empty;
            }

            const { selection } = tr;
            if (!selection.empty) return DecorationSet.empty;

            const widget = document.createElement('span');
            widget.className = 'text-slate-400 dark:text-slate-500 opacity-60 pointer-events-none select-none';
            widget.textContent = suggestion;

            const deco = Decoration.widget(selection.to, widget, {
              side: 1,
              suggestionText: suggestion, // Store text in spec
            });

            return DecorationSet.create(tr.doc, [deco]);
          },
        },
        props: {
          decorations(state) {
            return this.getState(state);
          },
          handleKeyDown(view, event) {
            if (event.key === 'Tab') {
              const state = ghostTextPluginKey.getState(view.state);
              if (state && state.find().length > 0) {
                const deco = state.find()[0];
                const suggestion = deco.spec.suggestionText;
                
                if (suggestion) {
                  const tr = view.state.tr.insertText(suggestion, view.state.selection.to);
                  tr.setMeta('ghostTextSuggestion', '');
                  view.dispatch(tr);
                  return true; // Prevent default Tab behavior
                }
              }
            }
            // If typing any other key, we might want to clear the suggestion
            // but we'll handle that in the editor's onUpdate
            return false;
          },
        },
      }),
    ];
  },
});
