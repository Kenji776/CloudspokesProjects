<?xml version="1.0" encoding="UTF-8"?>
<Workflow xmlns="http://soap.sforce.com/2006/04/metadata">
    <alerts>
        <fullName>PartyForce_Inform_Attendee_of_Invitation</fullName>
        <description>PartyForce Inform Attendee of Invitation</description>
        <protected>false</protected>
        <recipients>
            <field>Contact__c</field>
            <type>contactLookup</type>
        </recipients>
        <senderType>CurrentUser</senderType>
        <template>PartyForce_Emails/PartyForce_Invited</template>
    </alerts>
    <rules>
        <fullName>PartyForce Attendee Invited</fullName>
        <actions>
            <name>PartyForce_Inform_Attendee_of_Invitation</name>
            <type>Alert</type>
        </actions>
        <active>true</active>
        <criteriaItems>
            <field>Party_Force_Invite__c.RSVP_Status__c</field>
            <operation>equals</operation>
            <value>Invited</value>
        </criteriaItems>
        <description>Inform attendee they have been invited to an event</description>
        <triggerType>onCreateOnly</triggerType>
    </rules>
</Workflow>
