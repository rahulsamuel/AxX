

'use client';

import { 
  Project, 
  Client, 
  Staff,
  TeamMember,
  ClientLocation,
  Event,
  TrainingSession,
  PtoRequest,
  initialProjects, 
  initialClients, 
  staff as initialStaff,
  initialTeamMembers,
  initialClientTypes,
  initialEvents,
  initialEventTypes,
  trainingSessions as initialTrainingSessions,
  ptoRequests as initialPtoRequests,
} from './data';
import { db } from './firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, Timestamp, writeBatch, getDoc, query, where, arrayUnion, setDoc } from "firebase/firestore";

const DB_KEY_STAFF = 'eventflow_staff';
const DB_KEY_PTO = 'eventflow_pto';

export function initializeDatabase() {
  if (typeof window === 'undefined') return;
  
  const _ = db;

  const initKey = (key: string, data: any) => {
    if (!localStorage.getItem(key)) {
      localStorage.setItem(key, JSON.stringify(data));
    }
  };

  initKey(DB_KEY_STAFF, initialStaff);
  initKey(DB_KEY_PTO, initialPtoRequests);
}

const safeParse = <T,>(key: string): T[] => {
    if (typeof window === 'undefined') return [];
    try {
        const json = localStorage.getItem(key);
        if (!json) return [];
        const data = JSON.parse(json);
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error(`Error parsing ${key} from localStorage`, error);
        localStorage.removeItem(key); // Clear corrupted data
        return [];
    }
}

// --- Helper Functions ---
const toTimestamp = (date?: Date): Timestamp | null => {
  return date ? Timestamp.fromDate(date) : null;
};

const prepareProjectForFirestore = (project: any) => {
  const { id, ...projectData } = project;
  return {
    ...projectData,
    finalBillingAmount: project.finalBillingAmount ?? null,
    finalMargin: project.finalMargin ?? null,
    dates: {
        prepTravelIn: toTimestamp(project.dates.prepTravelIn),
        prepTravelOut: toTimestamp(project.dates.prepTravelOut),
        showTravelIn: toTimestamp(project.dates.showTravelIn),
        showTravelOut: toTimestamp(project.dates.showTravelOut),
        loadIn: { from: toTimestamp(project.dates.loadIn.from)!, to: toTimestamp(project.dates.loadIn.to)! },
        show: { from: toTimestamp(project.dates.show.from)!, to: toTimestamp(project.dates.show.to)! },
        loadOut: { from: toTimestamp(project.dates.loadOut.from)!, to: toTimestamp(project.dates.loadOut.to)! },
    },
  };
};

// --- Getter Functions ---

export async function getEvents(): Promise<Event[]> {
    if (!db) {
        throw new Error("Firebase not configured.");
    }

    const eventsCollection = collection(db, "events");
    const snapshot = await getDocs(eventsCollection);

    if (snapshot.empty) {
        const batch = writeBatch(db);
        initialEvents.forEach(event => {
            const docRef = doc(collection(db, "events"));
            const { id, ...eventData } = event;
            const eventDataForFirestore = {
                ...eventData,
                dates: {
                    from: Timestamp.fromDate(event.dates.from),
                    to: Timestamp.fromDate(event.dates.to),
                },
            };
            batch.set(docRef, eventDataForFirestore);
        });
        await batch.commit();
        const newSnapshot = await getDocs(eventsCollection);
        return newSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                dates: {
                    from: (data.dates.from as Timestamp).toDate(),
                    to: (data.dates.to as Timestamp).toDate(),
                },
            } as Event;
        });
    }

    return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            dates: {
                from: (data.dates.from as Timestamp).toDate(),
                to: (data.dates.to as Timestamp).toDate(),
            },
        } as Event;
    });
}

export async function getProjects(): Promise<Project[]> {
    if (!db) {
        throw new Error("Firebase not configured.");
    }

    const projectsCollection = collection(db, "projects");
    const snapshot = await getDocs(projectsCollection);

    if (snapshot.empty) {
        const batch = writeBatch(db);
        initialProjects.forEach(project => {
            const docRef = doc(collection(db, "projects"));
            batch.set(docRef, prepareProjectForFirestore(project));
        });
        await batch.commit();
        const newSnapshot = await getDocs(projectsCollection);
        // This map is minimal because we know it's being re-fetched on the page anyway.
        return newSnapshot.docs.map(doc => ({id: doc.id, ...doc.data()} as Project));
    }

    return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            dates: {
                prepTravelIn: data.dates.prepTravelIn?.toDate(),
                prepTravelOut: data.dates.prepTravelOut?.toDate(),
                showTravelIn: data.dates.showTravelIn?.toDate(),
                showTravelOut: data.dates.showTravelOut?.toDate(),
                loadIn: { from: data.dates.loadIn.from.toDate(), to: data.dates.loadIn.to.toDate() },
                show: { from: data.dates.show.from.toDate(), to: data.dates.show.to.toDate() },
                loadOut: { from: data.dates.loadOut.from.toDate(), to: data.dates.loadOut.to.toDate() },
            },
        } as Project;
    });
}


export async function getClients(): Promise<Client[]> {
  if (!db) {
    throw new Error("Firebase not configured.");
  }

  const clientsCollection = collection(db, "clients");
  const snapshot = await getDocs(clientsCollection);

  if (snapshot.empty) {
    const batch = writeBatch(db);
    initialClients.forEach(client => {
      const docRef = doc(collection(db, "clients"));
      const { id, ...clientData } = client;
      batch.set(docRef, clientData);
    });
    await batch.commit();
    const newSnapshot = await getDocs(clientsCollection);
    return newSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client));
  }

  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client));
}

export function getStaff(): Staff[] {
  return safeParse<Staff>(DB_KEY_STAFF);
}

export async function getTeamMembers(): Promise<TeamMember[]> {
  if (!db) {
    throw new Error("Firebase not configured.");
  }

  const membersCollection = collection(db, "teamMembers");
  const snapshot = await getDocs(membersCollection);

  if (snapshot.empty) {
    const batch = writeBatch(db);
    initialTeamMembers.forEach(member => {
      const docRef = doc(collection(db, "teamMembers"));
      batch.set(docRef, member);
    });
    await batch.commit();
    const newSnapshot = await getDocs(membersCollection);
    return newSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TeamMember));
  }

  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TeamMember));
}

export async function getClientTypes(): Promise<string[]> {
  if (!db) {
    return initialClientTypes;
  }
  const docRef = doc(db, "metadata", "clientTypes");
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists() || !docSnap.data()?.types) {
    await setDoc(docRef, { types: initialClientTypes }, { merge: true });
    return initialClientTypes;
  }
  return docSnap.data()?.types || [];
}

export async function getEventTypes(): Promise<string[]> {
  if (!db) {
    return Promise.resolve(initialEventTypes);
  }
  const docRef = doc(db, "metadata", "eventTypes");
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists() || !docSnap.data()?.types) {
    await setDoc(docRef, { types: initialEventTypes }, { merge: true });
    return initialEventTypes;
  }
  return docSnap.data()?.types || [];
}

export async function getTrainingSessions(): Promise<TrainingSession[]> {
    if (!db) {
        throw new Error("Firebase not configured.");
    }
    const sessionsCollection = collection(db, "trainingSessions");
    const snapshot = await getDocs(sessionsCollection);

    if (snapshot.empty) {
        const batch = writeBatch(db);
        initialTrainingSessions.forEach(session => {
            const docRef = doc(collection(db, "trainingSessions"));
            const { id, ...sessionData } = session;
            const sessionDataForFirestore = {
                ...sessionData,
                dates: {
                    from: Timestamp.fromDate(session.dates.from),
                    to: Timestamp.fromDate(session.dates.to),
                },
            };
            batch.set(docRef, sessionDataForFirestore);
        });
        await batch.commit();
        const newSnapshot = await getDocs(sessionsCollection);
        return newSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                dates: {
                    from: (data.dates.from as Timestamp).toDate(),
                    to: (data.dates.to as Timestamp).toDate(),
                },
            } as TrainingSession;
        });
    }

    return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            dates: {
                from: (data.dates.from as Timestamp).toDate(),
                to: (data.dates.to as Timestamp).toDate(),
            },
        } as TrainingSession;
    });
}

export async function getPtoRequests(): Promise<PtoRequest[]> {
  if (!db) {
    throw new Error("Firebase not configured.");
  }
  const ptoCollection = collection(db, "ptoRequests");
  const snapshot = await getDocs(ptoCollection);

  if (snapshot.empty) {
    const batch = writeBatch(db);
    initialPtoRequests.forEach(request => {
      const docRef = doc(collection(db, "ptoRequests"));
      const { id, ...requestData } = request;
      const requestDataForFirestore = {
        ...requestData,
        dates: {
          from: Timestamp.fromDate(request.dates.from),
          to: Timestamp.fromDate(request.dates.to),
        },
      };
      batch.set(docRef, requestDataForFirestore);
    });
    await batch.commit();
    const newSnapshot = await getDocs(ptoCollection);
    return newSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        dates: {
          from: (data.dates.from as Timestamp).toDate(),
          to: (data.dates.to as Timestamp).toDate(),
        },
      } as PtoRequest;
    });
  }

  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      dates: {
        from: (data.dates.from as Timestamp).toDate(),
        to: (data.dates.to as Timestamp).toDate(),
      },
    } as PtoRequest;
  });
}

// --- Setter/Adder Functions ---

export async function addEvent(newEventData: Omit<Event, 'id'>): Promise<Event> {
    if (!db) {
        throw new Error('Firebase is not configured. Cannot add event.');
    }
    
    const eventDataForFirestore = {
        ...newEventData,
        dates: {
            from: Timestamp.fromDate(newEventData.dates.from),
            to: Timestamp.fromDate(newEventData.dates.to),
        },
    };
    
    const docRef = await addDoc(collection(db, "events"), eventDataForFirestore);
    
    return {
        ...newEventData,
        id: docRef.id,
    };
}

export async function updateEvent(updatedEvent: Event): Promise<Event> {
    if (!db) {
        throw new Error('Firebase is not configured. Cannot update event.');
    }
    
    const eventRef = doc(db, "events", updatedEvent.id);
    const { id, ...eventData } = updatedEvent;

    const eventDataForFirestore = {
        ...eventData,
        dates: {
            from: Timestamp.fromDate(eventData.dates.from),
            to: Timestamp.fromDate(eventData.dates.to),
        },
    };

    await updateDoc(eventRef, eventDataForFirestore as any);
    return updatedEvent;
}

export async function deleteEvent(eventId: string) {
    if (!db) {
        throw new Error('Firebase is not configured. Cannot delete event.');
    }
    const eventRef = doc(db, "events", eventId);
    await deleteDoc(eventRef);
}


export async function addClient(newClientData: Omit<Client, 'id' | 'locations'> & { locations: Omit<ClientLocation, 'id'>[] }): Promise<Client> {
  if (!db) {
    throw new Error('Firebase is not configured.');
  }

  const clientDataForFirestore = {
    ...newClientData,
    locations: newClientData.locations.map((loc, index) => ({
      ...loc,
      id: `loc-${Date.now()}-${index}`,
    })),
    projectHistory: [],
    totalContribution: 0,
  };
  
  const docRef = await addDoc(collection(db, "clients"), clientDataForFirestore);
  
  return {
    ...clientDataForFirestore,
    id: docRef.id,
  };
}


export async function updateClient(updatedClient: Client): Promise<Client> {
  if (!db) {
    throw new Error('Firebase is not configured.');
  }
  
  const clientRef = doc(db, "clients", updatedClient.id);
  const { id, ...clientData } = updatedClient;

  await updateDoc(clientRef, clientData as any);
  
  return updatedClient;
}

export async function deleteClient(clientId: string) {
  if (!db) {
    throw new Error('Firebase is not configured.');
  }
  
  const clientRef = doc(db, "clients", clientId);
  await deleteDoc(clientRef);
}

export async function addProject(newProjectData: Omit<Project, 'id' | 'spentBudget' | 'progress'>): Promise<Project> {
  if (!db) {
    throw new Error('Firebase is not configured. Cannot add project.');
  }
  
  const projectDataForFirestore = {
    ...newProjectData,
    spentBudget: 0,
    progress: 0,
    dates: {
      prepTravelIn: toTimestamp(newProjectData.dates.prepTravelIn),
      prepTravelOut: toTimestamp(newProjectData.dates.prepTravelOut),
      showTravelIn: toTimestamp(newProjectData.dates.showTravelIn),
      showTravelOut: toTimestamp(newProjectData.dates.showTravelOut),
      loadIn: {
        from: toTimestamp(newProjectData.dates.loadIn.from)!,
        to: toTimestamp(newProjectData.dates.loadIn.to)!,
      },
      show: {
        from: toTimestamp(newProjectData.dates.show.from)!,
        to: toTimestamp(newProjectData.dates.show.to)!,
      },
      loadOut: {
        from: toTimestamp(newProjectData.dates.loadOut.from)!,
        to: toTimestamp(newProjectData.dates.loadOut.to)!,
      },
    },
  };

  const docRef = await addDoc(collection(db, "projects"), projectDataForFirestore);

  return {
    ...newProjectData,
    id: docRef.id,
    spentBudget: 0,
    progress: 0,
  };
}


export async function addTeamMember(newMemberData: Omit<TeamMember, 'id'>): Promise<TeamMember> {
  if (!db) {
    throw new Error('Firebase is not configured. Cannot add team member.');
  }
  
  const memberDataForFirestore = {
    ...newMemberData,
    avatarUrl: newMemberData.avatarUrl || '',
    status: 'Active',
    dashboardWidgets: {
      stats: true,
      monthlyProgress: true,
      eventStatus: true,
      upcomingDeadlines: true,
      budgetAlerts: true,
      eventOverview: true,
    }
  };

  const docRef = await addDoc(collection(db, "teamMembers"), memberDataForFirestore);
  
  return {
    ...memberDataForFirestore,
    id: docRef.id,
  };
}

export async function updateProject(updatedProject: Project): Promise<Project> {
  if (!db) {
    throw new Error('Firebase is not configured. Cannot update project.');
  }
  
  const projectRef = doc(db, "projects", updatedProject.id);
  const projectDataForFirestore = prepareProjectForFirestore(updatedProject);

  await updateDoc(projectRef, projectDataForFirestore as any);
  return updatedProject;
}

export async function deleteProject(projectId: string) {
  if (!db) {
    throw new Error('Firebase is not configured. Cannot delete project.');
  }
  const projectRef = doc(db, "projects", projectId);
  await deleteDoc(projectRef);
}


export async function updateTeamMember(updatedMember: TeamMember): Promise<TeamMember> {
  if (!db) {
    throw new Error('Firebase is not configured. Cannot update team member.');
  }
  
  const memberRef = doc(db, "teamMembers", updatedMember.id);
  const { id, ...memberData } = updatedMember;

  await updateDoc(memberRef, memberData as any);
  return updatedMember;
}

export async function updateUserDashboardWidgets(userId: string, widgets: Record<string, boolean>) {
    if (!db) {
        throw new Error("Firebase not configured.");
    }
    const memberRef = doc(db, "teamMembers", userId);
    await updateDoc(memberRef, { dashboardWidgets: widgets });
}

export async function deleteTeamMember(memberId: string) {
  if (!db) {
    throw new Error('Firebase is not configured. Cannot delete team member.');
  }
  
  const memberRef = doc(db, "teamMembers", memberId);
  await deleteDoc(memberRef);
}

export async function addTrainingSession(newSessionData: Omit<TrainingSession, 'id' | 'status'>): Promise<TrainingSession> {
    if (!db) {
        throw new Error('Firebase is not configured. Cannot add training session.');
    }
    
    const sessionDataForFirestore = {
        ...newSessionData,
        status: 'Scheduled' as const,
        dates: {
            from: Timestamp.fromDate(newSessionData.dates.from),
            to: Timestamp.fromDate(newSessionData.dates.to),
        },
    };
    
    const docRef = await addDoc(collection(db, "trainingSessions"), sessionDataForFirestore);
    
    return {
        ...sessionDataForFirestore,
        id: docRef.id,
        dates: newSessionData.dates, // Return with Date objects
    };
}

export async function updateTrainingSession(session: TrainingSession): Promise<TrainingSession> {
    if (!db) {
        throw new Error('Firebase is not configured.');
    }
    const sessionRef = doc(db, "trainingSessions", session.id);
    const { id, ...sessionData } = session;
    const dataToUpdate = {
        ...sessionData,
        dates: {
            from: Timestamp.fromDate(sessionData.dates.from),
            to: Timestamp.fromDate(sessionData.dates.to),
        }
    };
    await updateDoc(sessionRef, dataToUpdate as any);
    return session;
}

export async function deleteTrainingSession(sessionId: string): Promise<void> {
    if (!db) {
        throw new Error('Firebase is not configured.');
    }
    const sessionRef = doc(db, "trainingSessions", sessionId);
    await deleteDoc(sessionRef);
}

export async function addPtoRequest(newRequestData: Omit<PtoRequest, 'id' | 'status' | 'teamMemberId'>, teamMemberIds: string[]): Promise<PtoRequest[]> {
  if (!db) {
    throw new Error("Firebase not configured.");
  }
  const batch = writeBatch(db);
  const newRequests: PtoRequest[] = [];

  teamMemberIds.forEach(memberId => {
    const docRef = doc(collection(db, "ptoRequests"));
    const ptoData = {
      ...newRequestData,
      teamMemberId: memberId,
      status: 'Approved' as const,
      dates: {
        from: Timestamp.fromDate(newRequestData.dates.from),
        to: Timestamp.fromDate(newRequestData.dates.to),
      },
    };
    batch.set(docRef, ptoData);
    newRequests.push({ ...newRequestData, id: docRef.id, teamMemberId: memberId, status: 'Approved' });
  });

  await batch.commit();
  return newRequests;
}

export async function updatePtoRequest(request: PtoRequest): Promise<PtoRequest> {
    if (!db) {
        throw new Error('Firebase is not configured.');
    }
    const requestRef = doc(db, "ptoRequests", request.id);
    const { id, ...requestData } = request;
    const dataToUpdate = {
        ...requestData,
        dates: {
            from: Timestamp.fromDate(requestData.dates.from),
            to: Timestamp.fromDate(requestData.dates.to),
        }
    };
    await updateDoc(requestRef, dataToUpdate as any);
    return request;
}

export async function deletePtoRequest(requestId: string): Promise<void> {
    if (!db) {
        throw new Error('Firebase is not configured.');
    }
    const requestRef = doc(db, "ptoRequests", requestId);
    await deleteDoc(requestRef);
}
