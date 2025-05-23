import { describe, it, expect, beforeEach } from 'vitest';

// Mock implementation for testing Clarity contracts
const mockClarity = () => {
  let state = {
    projects: {},
    nextProjectId: 0,
    admin: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM' // Mock admin address
  };
  
  const txSender = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM'; // Default sender
  let currentSender = txSender;
  
  return {
    setSender: (sender) => {
      currentSender = sender;
    },
    
    // Project verification contract functions
    submitProject: (name, description, location) => {
      const projectId = state.nextProjectId;
      state.projects[projectId] = {
        owner: currentSender,
        name,
        description,
        location,
        status: 0, // pending
        verificationDate: 0,
        verifier: null
      };
      state.nextProjectId++;
      return { result: { value: projectId } };
    },
    
    verifyProject: (projectId, status) => {
      if (currentSender !== state.admin) {
        return { error: 'u2' }; // Not admin
      }
      
      if (status < 1 || status > 3) {
        return { error: 'u3' }; // Invalid status
      }
      
      if (!state.projects[projectId]) {
        return { error: 'u1' }; // Project not found
      }
      
      state.projects[projectId].status = status;
      state.projects[projectId].verificationDate = 100; // Mock block height
      state.projects[projectId].verifier = currentSender;
      
      return { result: { value: true } };
    },
    
    getProject: (projectId) => {
      if (!state.projects[projectId]) {
        return { result: { value: null } };
      }
      return { result: { value: state.projects[projectId] } };
    },
    
    transferAdmin: (newAdmin) => {
      if (currentSender !== state.admin) {
        return { error: 'u4' }; // Not admin
      }
      
      state.admin = newAdmin;
      return { result: { value: true } };
    },
    
    // For testing
    getState: () => state
  };
};

describe('Project Verification Contract', () => {
  let clarity;
  
  beforeEach(() => {
    clarity = mockClarity();
  });
  
  it('should allow submitting a new project', () => {
    const result = clarity.submitProject('Reforestation Project', 'Planting trees in deforested area', 'Amazon Rainforest');
    
    expect(result.result.value).toBe(0); // First project ID should be 0
    
    const state = clarity.getState();
    expect(state.projects[0]).toBeDefined();
    expect(state.projects[0].name).toBe('Reforestation Project');
    expect(state.projects[0].status).toBe(0); // Pending
  });
  
  it('should allow admin to verify a project', () => {
    // Submit a project first
    clarity.submitProject('Reforestation Project', 'Planting trees in deforested area', 'Amazon Rainforest');
    
    // Verify the project
    const result = clarity.verifyProject(0, 1); // Approve project
    
    expect(result.result.value).toBe(true);
    
    const state = clarity.getState();
    expect(state.projects[0].status).toBe(1); // Approved
    expect(state.projects[0].verifier).toBe('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM');
  });
  
  it('should not allow non-admin to verify a project', () => {
    // Submit a project first
    clarity.submitProject('Reforestation Project', 'Planting trees in deforested area', 'Amazon Rainforest');
    
    // Try to verify as non-admin
    clarity.setSender('ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG');
    const result = clarity.verifyProject(0, 1);
    
    expect(result.error).toBe('u2'); // Not admin error
    
    const state = clarity.getState();
    expect(state.projects[0].status).toBe(0); // Still pending
  });
  
  it('should allow retrieving project details', () => {
    // Submit a project first
    clarity.submitProject('Reforestation Project', 'Planting trees in deforested area', 'Amazon Rainforest');
    
    // Get project details
    const result = clarity.getProject(0);
    
    expect(result.result.value).toBeDefined();
    expect(result.result.value.name).toBe('Reforestation Project');
    expect(result.result.value.location).toBe('Amazon Rainforest');
  });
});
