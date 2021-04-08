<?xml version="1.0" encoding="UTF-8"?>
<Workflow xmlns="http://soap.sforce.com/2006/04/metadata">
    <alerts>
        <fullName>Inform_user_of_event_creation</fullName>
        <description>Inform user of event creation</description>
        <protected>false</protected>
        <recipients>
            <field>CreatedBy__c</field>
            <type>contactLookup</type>
        </recipients>
        <senderType>CurrentUser</senderType>
        <template>PartyForce_Emails/PartyForce_Event_Created</template>
    </alerts>
    <alerts>
        <fullName>Send_PartyForce_Event_Approved</fullName>
        <description>Send PartyForce Event Approved</description>
        <protected>false</protected>
        <recipients>
            <field>CreatedBy__c</field>
            <type>contactLookup</type>
        </recipients>
        <senderType>CurrentUser</senderType>
        <template>PartyForce_Emails/PartyForce_Event_Approved</template>
    </alerts>
    <alerts>
        <fullName>Send_PartyForce_Event_Rejected</fullName>
        <description>Send PartyForce Event Rejected</description>
        <protected>false</protected>
        <recipients>
            <field>CreatedBy__c</field>
            <type>contactLookup</type>
        </recipients>
        <senderType>CurrentUser</senderType>
        <template>PartyForce_Emails/PartyForce_Event_Rejected</template>
    </alerts>
    <fieldUpdates>
        <fullName>Change_Event_To_Complete</fullName>
        <field>Status__c</field>
        <literalValue>Complete</literalValue>
        <name>Change Event To Complete</name>
        <notifyAssignee>false</notifyAssignee>
        <operation>Literal</operation>
        <protected>false</protected>
    </fieldUpdates>
    <fieldUpdates>
        <fullName>Change_Event_To_In_Progress</fullName>
        <field>Status__c</field>
        <literalValue>In Progress</literalValue>
        <name>Change Event To In Progress</name>
        <notifyAssignee>false</notifyAssignee>
        <operation>Literal</operation>
        <protected>false</protected>
    </fieldUpdates>
    <rules>
        <fullName>Change Event To Complete</fullName>
        <active>true</active>
        <description>When an event has reached its start time, change the status to in progress</description>
        <formula>True</formula>
        <triggerType>onCreateOnly</triggerType>
    </rules>
    <rules>
        <fullName>Change Event To In Progress</fullName>
        <active>true</active>
        <description>When an event has reached its start time, change the status to in progress</description>
        <formula>True</formula>
        <triggerType>onCreateOnly</triggerType>
    </rules>
    <rules>
        <fullName>Inform of event creation</fullName>
        <actions>
            <name>Inform_user_of_event_creation</name>
            <type>Alert</type>
        </actions>
        <active>true</active>
        <description>Let a user know their event has been created and will be approved or rejected shortly.</description>
        <formula>true</formula>
        <triggerType>onCreateOnly</triggerType>
    </rules>
    <rules>
        <fullName>PartyForce Event Approved</fullName>
        <actions>
            <name>Send_PartyForce_Event_Approved</name>
            <type>Alert</type>
        </actions>
        <active>true</active>
        <criteriaItems>
            <field>Party_Force_Event__c.Status__c</field>
            <operation>equals</operation>
            <value>Approved</value>
        </criteriaItems>
        <description>Inform host their event has been approved</description>
        <triggerType>onCreateOrTriggeringUpdate</triggerType>
    </rules>
    <rules>
        <fullName>PartyForce Event Rejected</fullName>
        <actions>
            <name>Send_PartyForce_Event_Rejected</name>
            <type>Alert</type>
        </actions>
        <active>true</active>
        <criteriaItems>
            <field>Party_Force_Event__c.Status__c</field>
            <operation>equals</operation>
            <value>Rejected</value>
        </criteriaItems>
        <description>Inform host their event has been rejected</description>
        <triggerType>onCreateOrTriggeringUpdate</triggerType>
    </rules>
</Workflow>
