/* global jest */
import { toUint8Array } from '@/utils'
import { state as hcState, actions as hcActions, mutations as hcMutations } from '@/store/holochain'
import elementalChatComponent, { state as chatState, actions as chatActions, mutations as chatMutations } from '@/store/elementalChat'
import { storeRaw } from '@/store'
import { v4 as uuidv4 } from 'uuid'
import Vuex from 'vuex'

export const DNA_VERSION_MOCK = 'uhC0kvrTHaVNrHaYMBEBbP9nQDA8xdat45mfQb9NtklMJ1ZOfqmZh'
export const DNA_HASH_MOCK = toUint8Array(Buffer.from(DNA_VERSION_MOCK, 'base64'))
export const AGENT_KEY_MOCK = toUint8Array(Buffer.from('uhCAkKCV0Uy9OtfjpcO/oQcPO6JN6TOhnOjwkamI3dNDNi+359faa', 'base64'))

export const timestampToSemanticDate = (timestamp) => {
  return `${new Date(timestamp[0] * 1000)}`
}

/// Stubbing Element helpers :
// --------------------
// create message for api input into dna
export const createNewMessage = (uuid = uuidv4(), content, agent = '') => ({
  createdBy: agent,
  entry: { content, uuid },
  messages: [],
  createdAt: [0, 0]
})

// create message mocking api output from dna
export const createMockMessage = (uuid = uuidv4(), content, agent = '', timestamp = [0, 0]) => ({
  entry: {
    uuid,
    content // "agent: testing message"
  },
  entryHash: {},
  createdBy: agent,
  createdAt: timestamp
})

// create channel for api input into dna
export const createNewChannel = (uuid = uuidv4(), name) => ({
  info: {
    name,
    created_by: ''
  },
  entry: { category: 'General', uuid },
  messages: [],
  last_seen: {}
})

// create channel mocking api output from dna
export const createMockChannel = (uuid = uuidv4(), name, agent = '') => ({
  info: {
    name,
    created_by: agent
  },
  entry: { category: 'General', uuid },
  messages: [],
  activeChatters: [agent],
  unseen: false
})

export const getCurrentChannel = chatState => {
  if (chatState.currentChannelId === null) return emptyChannel
  return chatState.channels.find(channel => channel.entry.uuid === chatState.currentChannelId)
}

export const emptyChannel = {
  info: { name: '' },
  entry: { category: 'General', uuid: '' },
  messages: [],
  activeChatters: [],
  unseen: false
}

export const mockChatState = {
  ...chatState,
  stats: {
    agentCount: 0,
    activeCount: 0,
    channelCount: 0,
    messageCount: 0
  },
  // start with empty to mock showingAdd() behavior in channels component on first render
  channels: [emptyChannel],
  currentChannelId: null,
  statsLoading: false
}

export const resetChatState = () => {
  mockChatState.stats = {
    agentCount: 0,
    activeCount: 0,
    channelCount: 0,
    messageCount: 0
  }
  mockChatState.channels = [emptyChannel]
  mockChatState.currentChannelId = null
  mockChatState.statsLoading = false
}

export const mockHolochainState = {
  ...hcState,
  agentKey: AGENT_KEY_MOCK,
  dnaHash: DNA_VERSION_MOCK
}

export const resetHolochainState = () => {
  mockAgentState.agentKey = AGENT_KEY_MOCK
  mockAgentState.dnaHash = DNA_VERSION_MOCK
}

export const mockAgentState = {
  needsHandle: true,
  agentHandle: ''
}

export const resetAgentState = () => {
  mockAgentState.needsHandle = true
  mockAgentState.agentHandle = ''
}

export let stubbedActions = {}
export const setStubbedActions = (actionStubs = {}) => {
  const actions = {
    chat: { ...actionStubs.chat, ...chatActions },
    holochain: { ...actionStubs.holochain, ...hcActions },
    index: { ...actionStubs.index, ...storeRaw.actions }
  }
  stubbedActions = { actions, ...stubbedActions }
  return stubbedActions
}

export let stubbedMutations = {}
export const setStubbedMutations = (mutationStubs = {}) => {
  const mutations = {
    chat: { ...mutationStubs.chat, ...chatMutations },
    holochain: { ...mutationStubs.holochain, ...hcMutations },
    index: { ...mutationStubs.index, ...storeRaw.mutations }
  }
  stubbedMutations = { mutations, ...stubbedMutations }
  return stubbedMutations
}

export const setStubbedStore = (agentState = mockAgentState, holochainState = mockHolochainState, chatState = mockChatState, actions = stubbedActions, mutations = stubbedMutations, opts = {}) => {
  const { callLoading, additionalChannels } = opts
  if (actions === {}) {
    actions = setStubbedActions()
  }
  if (mutations === {}) {
    mutations = setStubbedMutations()
  }
  const channelsList = chatState.channels
  if (additionalChannels) {
    for (let i; i <= additionalChannels; i++) {
      channelsList.push(createMockChannel(i, `Channel #${i}`, agentState.agentHandle || `test-agent-${i}`))
    }
  }
  return new Vuex.Store({
    actions: { ...actions.index },
    mutations: { ...mutations.index },
    state: {
      ...agentState,
      errorMessage: ''
    },
    modules: {
      elementalChat: {
        namespaced: true,
        state: chatState,
        actions: { ...actions.chat, listChannels: () => Promise.resolve(channelsList) },
        mutations: { ...mutations.chat },
        getters: {
          createMessageLoading: () => callLoading || false,
          channel: () => getCurrentChannel(chatState)
          // channel: elementalChatComponent.getters.channel.mockImplementation(() => getCurrentChannel(chatState))
        }
      },
      holochain: {
        namespaced: true,
        state: holochainState,
        actions: { ...actions.holochain },
        mutations: { ...mutations.holochain }
      }
    }
  })
}

/// Window Mock helpers:
// --------------------
export const navigateToNextLocation = () => {
  const location = window.location.href + '/next'
  window.location.replace(location)
}

export const mockWindowReplace = jest.fn()
const mockWindowOpen = jest.fn()
// without a copy of window, a circular dependency problem occurs
const originalWindow = { ...window }
export const windowSpy = jest.spyOn(global, 'window', 'get')
export const mockWindowRedirect = (hrefLocation) => windowSpy.mockImplementation(() => ({
  ...originalWindow,
  location: {
    ...originalWindow.location,
    href: hrefLocation,
    replace: mockWindowReplace
  },
  open: mockWindowOpen
}))
