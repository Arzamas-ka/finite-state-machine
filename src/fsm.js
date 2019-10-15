const getLastElement = arr => arr.slice(-1)[0];

class FSM {
  /**
   * Creates new FSM instance.
   * @param config
   */
  constructor(config) {
    if (!config) {
      throw new Error('Empty config');
    }

    this.config = config;
    this.state = config.initial;
    this.states = config.states;
    this.availableTransitions = this.getAvailableTransitions(
      this.state,
      this.states,
    );
    this.history = this.initializeHistory(this.config.initial);
    this.undoHistory = [];
    this.isEnabledRedo = false;

    this.transitions = this.parseTransitions();
  }

  initializeHistory(initialState) {
    return {
      currentID: 1,
      states: [
        {
          id: 1,
          state: initialState,
        },
      ],
    };
  }

  parseTransitions() {
    return Object.values(this.states)
      .map(transitionObject => {
        return transitionObject['transitions'];
      })
      .reduce((acc, next) => {
        Object.entries(next).forEach(entry => {
          const [transitionType, transitionValue] = entry;
          acc[transitionType] = transitionValue;
        });

        return acc;
      }, {});
  }

  getAvailableTransitions(state, states) {
    return states[state].transitions;
  }

  /**
   * Returns active state.
   * @returns {String}
   */
  getState() {
    return this.state;
  }

  /**
   * Goes to specified state.
   * @param state
   */
  changeState(state) {
    if (!this.states[state]) {
      throw new Error('Does not exist such state');
    }

    this.state = state;
    this.availableTransitions = this.getAvailableTransitions(
      this.state,
      this.states,
    );

    this.addToHistory(state);
    this.isEnabledRedo = false;
  }

  addToHistory(state) {
    const lastHistoryItem = getLastElement(this.history.states);
    const currentState = { state, id: lastHistoryItem.id + 1 };
    this.history.states.push(currentState);
    this.history.currentID = currentState.id;
  }

  /**
   * Changes state according to event transition rules.
   * @param event
   */
  trigger(event) {
    if (!this.availableTransitions[event]) {
      throw new Error('Current state does not exist');
    }

    this.changeState(this.availableTransitions[event]);
  }

  /**
   * Resets FSM state to initial.
   */
  reset() {
    this.changeState(this.config.initial);
  }

  /**
   * Returns an array of states for which there are specified event transition rules.
   * Returns all states if argument is undefined.
   * @param event
   * @returns {Array}
   */
  getStates(event) {
    if (!event) {
      return Object.keys(this.states);
    }

    return Object.entries(this.states)
      .filter(state => {
        const [stateName, stateObject] = state;

        return Object.keys(stateObject.transitions).includes(event);
      })
      .map(state => {
        const [stateName] = state;
        return stateName;
      });
  }

  /**
   * Goes back to previous state.
   * Returns false if undo is not available.
   * @returns {Boolean}
   */
  undo() {
    if (this.history.states.length === 1) {
      return false;
    }

    this.history.currentID -= 1;
    this.undoHistory.push(this.history.states.pop());
    const { state } = getLastElement(this.history.states);
    this.state = state;
    this.availableTransitions = this.getAvailableTransitions(
      state,
      this.states,
    );
    this.isEnabledRedo = true;

    return true;
  }

  /**
   * Goes redo to state.
   * Returns false if redo is not available.
   * @returns {Boolean}
   */
  redo() {
    if (!this.undoHistory.length || !this.isEnabledRedo) {
      return false;
    }

    const previousState = this.undoHistory.pop();
    this.history.states.push(previousState);
    this.history.currentID = previousState.id;
    this.state = previousState.state;
    this.availableTransitions = this.getAvailableTransitions(
      this.state,
      this.states,
    );

    return true;
  }

  /**
   * Clears transition history
   */
  clearHistory() {
    this.undoHistory = [];
    this.history = this.initializeHistory(this.config.initial);
  }
}

module.exports = FSM;

/** @Created by Uladzimir Halushka **/