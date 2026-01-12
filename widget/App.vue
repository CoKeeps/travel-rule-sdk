<template>
  <div class="container">
    <h1>Travel Rule Widget</h1>
    
    <div class="form-section">
      <label for="endpoint">API Endpoint:</label>
      <input 
        v-model="endpoint"
        type="text" 
        id="endpoint" 
      />
      <button 
        @click="initializeOrUpdateEndpoint()" 
        class="update-endpoint-button"
      >
        {{ sdk ? 'Update Endpoint' : 'Initialize SDK' }}
      </button>
    </div>

    <div v-if="sdk" class="shared-section">
      <div class="form-group">
        <h3 class="form-group-title">Certificate & Authentication</h3>
        <div class="form-section">
          <label for="certificateFile">Upload Certificate (.json file only):</label>
          <input 
            @change="handleFileUpload"
            type="file" 
            id="certificateFile" 
            accept=".json"
          />
          <div v-if="fileName" class="file-info">
            Uploaded: <strong>{{ fileName }}</strong>
          </div>
          <div v-else class="file-info" style="color: #999; font-style: italic;">
            No file uploaded
          </div>
        </div>
        <button 
          @click="getAccessToken()" 
          :disabled="loading || !fileJsonData"
          class="send-button"
        >
          {{ accessToken ? 'Refresh Access Token' : 'Get Access Token' }}
        </button>
        <div v-if="accessTokenResult" :class="['result', accessTokenResult.type]" style="margin-top: 15px;">
          <strong>{{ accessTokenResult.message }}</strong>
          <pre v-if="accessTokenResult.data">{{ JSON.stringify(accessTokenResult.data, null, 2) }}</pre>
        </div>
      </div>
    </div>

    <div v-if="sdk" class="tabs">
      <div class="tabs-left">
        <button 
          @click="activeTab = 'inbound'"
          :class="['tab-button', { active: activeTab === 'inbound' }]"
        >
          Get Message
        </button>
        <button 
          @click="activeTab = 'outbound'"
          :class="['tab-button', { active: activeTab === 'outbound' }]"
        >
          Send Message
        </button>
      </div>
      <div v-if="accessToken && countdownDisplay" class="token-countdown">
        Token expires in: <strong>{{ countdownDisplay }}</strong>
      </div>
    </div>

    <div v-if="sdk && activeTab === 'inbound'" class="tab-content">
      <div class="form-section">
        <label for="messageId">Message ID:</label>
        <input 
          v-model="messageId"
          type="text" 
          id="messageId"
        />
      </div>
    </div>

    <div v-if="sdk && activeTab === 'outbound'" class="tab-content">
      <div class="form-group">
        <h3 class="form-group-title">Message Information</h3>
        <div class="form-section">
          <label for="ivms101Version">IVMS101 Version: <span class="required">*</span></label>
          <input v-model="formData.ivms101Version" type="text" id="ivms101Version" required />
        </div>
        <div class="form-section">
          <label for="outboundMessageId">Message ID: <span class="required">*</span></label>
          <input v-model="formData.messageId" type="text" id="outboundMessageId" required />
        </div>
        <div class="form-section">
          <label for="createdAt">Created At: <span class="required">*</span></label>
          <input v-model="createdAtDatetimeLocal" type="datetime-local" id="createdAt" required />
        </div>
      </div>

      <div class="form-group">
        <h3 class="form-group-title">Transfer Information</h3>
        <div class="form-section">
          <label for="direction">Direction: <span class="required">*</span></label>
          <select v-model="formData.transfer.direction" id="direction" required>
            <option value="">Select...</option>
            <option value="OUTBOUND">Outbound - Outgoing Transfer</option>
            <option value="INBOUND">Inbound - Incoming Transfer</option>
          </select>
        </div>
        <div class="form-row">
          <div class="form-section">
            <label for="asset">Asset: <span class="required">*</span></label>
            <input v-model="formData.transfer.asset" type="text" id="asset" required />
          </div>
          <div class="form-section">
            <label for="amount">Amount: <span class="required">*</span></label>
            <input v-model="formData.transfer.amount" type="text" id="amount" required />
          </div>
        </div>
        <div class="form-section">
          <label for="network">Network: <span class="required">*</span></label>
          <input v-model="formData.transfer.network" type="text" id="network" required />
        </div>
        <div class="form-section">
          <label for="txHash">Transaction Hash: <span class="required">*</span></label>
          <input v-model="formData.transfer.txHash" type="text" id="txHash" required />
        </div>
        <div class="form-section">
          <label for="originatingAddress">Originating Address: <span class="required">*</span></label>
          <input v-model="formData.transfer.originatingAddress" type="text" id="originatingAddress" required />
        </div>
        <div class="form-section">
          <label for="beneficiaryAddress">Beneficiary Address: <span class="required">*</span></label>
          <input v-model="formData.transfer.beneficiaryAddress" type="text" id="beneficiaryAddress" required />
        </div>
        <div class="form-row">
          <div class="form-section">
            <label for="memoOrTag">Memo or Tag:</label>
            <input v-model="formData.transfer.memoOrTag" type="text" id="memoOrTag" />
          </div>
          <div class="form-section">
            <label for="internalRef">Your Internal Reference:</label>
            <input v-model="formData.transfer.internalRef" type="text" id="internalRef" />
          </div>
        </div>
      </div>

      <div class="form-group">
        <h3 class="form-group-title">Originating VASP</h3>
        <div class="form-section">
          <label for="originatingVaspName">VASP Name: <span class="required">*</span></label>
          <input v-model="formData.originatingVasp.vaspName" type="text" id="originatingVaspName" required />
        </div>
        <div class="form-row">
          <div class="form-section">
            <label for="originatingVaspIdentifierType">Identifier Type:</label>
            <select v-model="formData.originatingVasp.vaspIdentifier.type" id="originatingVaspIdentifierType">
              <option value="">Select...</option>
              <option value="LEI">LEI - Legal Entity Identifier (ISO 17442)</option>
              <option value="BIC">BIC - Business Identifier Code / SWIFT (ISO 9362)</option>
              <option value="LOCAL">LOCAL - Local/National Official Identifier</option>
              <option value="OTHER">OTHER - Other Identifier Scheme</option>
            </select>
          </div>
          <div class="form-section">
            <label for="originatingVaspIdentifierValue">Identifier Value:</label>
            <input v-model="formData.originatingVasp.vaspIdentifier.value" type="text" id="originatingVaspIdentifierValue" />
          </div>
        </div>
      </div>

      <div class="form-group">
        <h3 class="form-group-title">Beneficiary VASP</h3>
        <div class="form-section">
          <label for="beneficiaryVaspName">VASP Name: <span class="required">*</span></label>
          <input v-model="formData.beneficiaryVasp.vaspName" type="text" id="beneficiaryVaspName" required />
        </div>
        <div class="form-row">
          <div class="form-section">
            <label for="beneficiaryVaspIdentifierType">Identifier Type:</label>
            <select v-model="formData.beneficiaryVasp.vaspIdentifier.type" id="beneficiaryVaspIdentifierType">
              <option value="">Select...</option>
              <option value="LEI">LEI - Legal Entity Identifier (ISO 17442)</option>
              <option value="BIC">BIC - Business Identifier Code / SWIFT (ISO 9362)</option>
              <option value="LOCAL">LOCAL - Local/National Official Identifier</option>
              <option value="OTHER">OTHER - Other Identifier Scheme</option>
            </select>
          </div>
          <div class="form-section">
            <label for="beneficiaryVaspIdentifierValue">Identifier Value:</label>
            <input v-model="formData.beneficiaryVasp.vaspIdentifier.value" type="text" id="beneficiaryVaspIdentifierValue" />
          </div>
        </div>
      </div>

      <div class="form-group">
        <h3 class="form-group-title">Originator</h3>
        <div class="form-section">
          <label for="originatorType">Type: <span class="required">*</span></label>
          <select v-model="formData.originator.type" id="originatorType" required>
            <option value="">Select...</option>
            <option value="NATURAL">NATURAL - Individual (Natural Person)</option>
            <option value="LEGAL">LEGAL - Organization/Entity (Legal Person)</option>
          </select>
        </div>
        <div class="form-section">
          <label>Name Identifier:</label>
          <div class="form-row">
            <div class="form-section">
              <label for="originatorPrimaryIdentifier">Primary Identifier: <span class="required">*</span></label>
              <input v-model="formData.originator.name.nameIdentifier[0].primaryIdentifier" type="text" id="originatorPrimaryIdentifier" required />
            </div>
            <div class="form-section">
              <label for="originatorSecondaryIdentifier">Secondary Identifier:</label>
              <input v-model="formData.originator.name.nameIdentifier[0].secondaryIdentifier" type="text" id="originatorSecondaryIdentifier" />
            </div>
            <div class="form-section">
              <label for="originatorNameIdentifierType">Name Identifier Type: <span class="required">*</span></label>
              <select v-model="formData.originator.name.nameIdentifier[0].nameIdentifierType" id="originatorNameIdentifierType" required>
                <option value="">Select...</option>
                <option value="LEGL">LEGL - Legal/Registered Name</option>
                <option value="ALIA">ALIA - Alias Name</option>
                <option value="TRAD">TRAD - Trading Name</option>
              </select>
            </div>
          </div>
        </div>
        <div class="form-row">
          <div class="form-section">
            <label for="originatorCustomerIdentification">Customer Identification:</label>
            <input v-model="formData.originator.customerIdentification" type="text" id="originatorCustomerIdentification" />
          </div>
          <div class="form-section">
            <label for="originatorAccountNumber">Account Number:</label>
            <input v-model="formData.originator.accountNumber" type="text" id="originatorAccountNumber" />
          </div>
        </div>
        <div class="form-section">
          <label>Geographic Address:</label>
          <div class="form-row">
            <div class="form-section">
              <label for="originatorAddressType">Address Type:</label>
              <select v-model="formData.originator.geographicAddress[0].addressType" id="originatorAddressType">
                <option value="">Select...</option>
                <option value="HOME">HOME - Residential/Home Address</option>
                <option value="BIZZ">BIZZ - Business Address</option>
                <option value="GEOG">GEOG - Geographic/Unspecified Physical Address</option>
              </select>
            </div>
            <div class="form-section">
              <label for="originatorStreetName">Street Name:</label>
              <input v-model="formData.originator.geographicAddress[0].streetName" type="text" id="originatorStreetName" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-section">
              <label for="originatorBuildingNumber">Building Number:</label>
              <input v-model="formData.originator.geographicAddress[0].buildingNumber" type="text" id="originatorBuildingNumber" />
            </div>
            <div class="form-section">
              <label for="originatorTownName">Town Name:</label>
              <input v-model="formData.originator.geographicAddress[0].townName" type="text" id="originatorTownName" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-section">
              <label for="originatorCountrySubDivision">Country Sub Division:</label>
              <input v-model="formData.originator.geographicAddress[0].countrySubDivision" type="text" id="originatorCountrySubDivision" />
            </div>
            <div class="form-section">
              <label for="originatorPostCode">Post Code:</label>
              <input v-model="formData.originator.geographicAddress[0].postCode" type="text" id="originatorPostCode" />
            </div>
            <div class="form-section">
              <label for="originatorCountry">Country: <span class="required">*</span></label>
              <input v-model="formData.originator.geographicAddress[0].country" type="text" id="originatorCountry" required />
            </div>
          </div>
        </div>
        <div class="form-section">
          <label>National Identification (Optional):</label>
          <div class="form-row">
            <div class="form-section">
              <label for="originatorNationalIdentifier">National Identifier:</label>
              <input v-model="formData.originator.nationalIdentification[0].nationalIdentifier" type="text" id="originatorNationalIdentifier" />
            </div>
            <div class="form-section">
              <label for="originatorNationalIdentifierType">Identifier Type:</label>
              <select v-model="formData.originator.nationalIdentification[0].nationalIdentifierType" id="originatorNationalIdentifierType">
                <option value="">Select...</option>
                <option value="ARNU">ARNU - Alien Registration Number</option>
                <option value="CCPT">CCPT - Passport Number</option>
                <option value="DRLC">DRLC - Driver License Number</option>
                <option value="NIDN">NIDN - National Identity Number</option>
                <option value="TXID">TXID - Tax Identification Number</option>
                <option value="SOCS">SOCS - Social Security Number</option>
                <option value="RAID">RAID - Registration Authority Identifier</option>
                <option value="LEIX">LEIX - Legal Entity Identifier (LEI)</option>
              </select>
            </div>
            <div class="form-section">
              <label for="originatorCountryOfIssue">Country of Issue:</label>
              <input v-model="formData.originator.nationalIdentification[0].countryOfIssue" type="text" id="originatorCountryOfIssue" />
            </div>
          </div>
        </div>
        <div class="form-section">
          <label>Date and Place of Birth (Optional):</label>
          <div class="form-row">
            <div class="form-section">
              <label for="originatorBirthDate">Birth Date (YYYY-MM-DD):</label>
              <input v-model="formData.originator.dateAndPlaceOfBirth.birthDate" type="date" id="originatorBirthDate" />
            </div>
            <div class="form-section">
              <label for="originatorCityOfBirth">City of Birth:</label>
              <input v-model="formData.originator.dateAndPlaceOfBirth.cityOfBirth" type="text" id="originatorCityOfBirth" />
            </div>
            <div class="form-section">
              <label for="originatorCountryOfBirth">Country of Birth:</label>
              <input v-model="formData.originator.dateAndPlaceOfBirth.countryOfBirth" type="text" id="originatorCountryOfBirth" />
            </div>
          </div>
        </div>
      </div>

      <div class="form-group">
        <h3 class="form-group-title">Beneficiary</h3>
        <div class="form-section">
          <label for="beneficiaryType">Type: <span class="required">*</span></label>
          <select v-model="formData.beneficiary.type" id="beneficiaryType" required>
            <option value="">Select...</option>
            <option value="NATURAL">NATURAL - Individual (Natural Person)</option>
            <option value="LEGAL">LEGAL - Organization/Entity (Legal Person)</option>
          </select>
        </div>
        <div class="form-section">
          <label>Name Identifier:</label>
          <div class="form-row">
            <div class="form-section">
              <label for="beneficiaryPrimaryIdentifier">Primary Identifier: <span class="required">*</span></label>
              <input v-model="formData.beneficiary.name.nameIdentifier[0].primaryIdentifier" type="text" id="beneficiaryPrimaryIdentifier" required />
            </div>
            <div class="form-section">
              <label for="beneficiarySecondaryIdentifier">Secondary Identifier:</label>
              <input v-model="formData.beneficiary.name.nameIdentifier[0].secondaryIdentifier" type="text" id="beneficiarySecondaryIdentifier" />
            </div>
            <div class="form-section">
              <label for="beneficiaryNameIdentifierType">Name Identifier Type: <span class="required">*</span></label>
              <select v-model="formData.beneficiary.name.nameIdentifier[0].nameIdentifierType" id="beneficiaryNameIdentifierType" required>
                <option value="">Select...</option>
                <option value="LEGL">LEGL - Legal/Registered Name</option>
                <option value="ALIA">ALIA - Alias Name</option>
                <option value="TRAD">TRAD - Trading Name</option>
              </select>
            </div>
          </div>
        </div>
        <div class="form-row">
          <div class="form-section">
            <label for="beneficiaryCustomerIdentification">Customer Identification:</label>
            <input v-model="formData.beneficiary.customerIdentification" type="text" id="beneficiaryCustomerIdentification" />
          </div>
          <div class="form-section">
            <label for="beneficiaryAccountNumber">Account Number:</label>
            <input v-model="formData.beneficiary.accountNumber" type="text" id="beneficiaryAccountNumber" />
          </div>
        </div>
      </div>

      <div class="form-group">
        <h3 class="form-group-title">Contact Information (Optional)</h3>
        <div class="form-section">
          <label for="complianceEmail">Compliance Email:</label>
          <input v-model="formData.contact.complianceEmail" type="email" id="complianceEmail" />
        </div>
        <div class="form-section">
          <label for="supportReference">Support Reference:</label>
          <input v-model="formData.contact.supportReference" type="text" id="supportReference" />
        </div>
      </div>
    </div>

    <button 
      v-if="sdk"
      @click="activeTab === 'inbound' ? getMessage() : sendData()" 
      :disabled="loading"
      class="send-button"
    >
      {{ loading ? (activeTab === 'inbound' ? 'Getting...' : 'Sending...') : (activeTab === 'inbound' ? 'Get Message' : 'Send Message') }}
    </button>

    <div v-if="result" :class="['result', result.type]">
      <strong>{{ result.message }}</strong>
      <pre v-if="result.data">{{ JSON.stringify(result.data, null, 2) }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { TravelSDKClient, type VaspKeys } from 'travel-sdk';

const endpoint = ref('');
const sdk = ref<TravelSDKClient | null>(null);
const activeTab = ref<'inbound' | 'outbound'>('inbound');
const messageId = ref('');
const fileName = ref('');
const fileJsonData = ref<VaspKeys | null>(null);
const accessToken = ref<any>(null);
const accessTokenResult = ref<{ type: 'success' | 'error'; message: string; data?: any } | null>(null);
const loading = ref(false);
const result = ref<{ type: 'success' | 'error'; message: string; data?: any } | null>(null);
const tokenExpiresAt = ref<number | null>(null);
const countdownInterval = ref<ReturnType<typeof setInterval> | null>(null);
const currentTime = ref<number>(Date.now());

const getCurrentISOTimestamp = () => {
  return new Date().toISOString();
};

const formData = ref({
  ivms101Version: '1.0',
  messageId: '',
  createdAt: getCurrentISOTimestamp(),
  transfer: {
    direction: undefined,
    asset: '',
    amount: '',
    network: '',
    txHash: '',
    originatingAddress: '',
    beneficiaryAddress: '',
    memoOrTag: '',
    internalRef: ''
  },
  originatingVasp: {
    vaspName: '',
    vaspIdentifier: {
      type: undefined,
      value: ''
    }
  },
  beneficiaryVasp: {
    vaspName: '',
    vaspIdentifier: {
      type: undefined,
      value: ''
    }
  },
  originator: {
    type: undefined,
    name: {
      nameIdentifier: [{
        primaryIdentifier: '',
        secondaryIdentifier: '',
        nameIdentifierType: undefined
      }]
    },
    customerIdentification: '',
    accountNumber: '',
    geographicAddress: [{
      addressType: undefined,
      streetName: '',
      buildingNumber: '',
      townName: '',
      countrySubDivision: '',
      postCode: '',
      country: ''
    }],
    nationalIdentification: [{
      nationalIdentifier: '',
      nationalIdentifierType: undefined,
      countryOfIssue: ''
    }],
    dateAndPlaceOfBirth: {
      birthDate: '',
      cityOfBirth: '',
      countryOfBirth: ''
    }
  },
  beneficiary: {
    type: undefined,
    name: {
      nameIdentifier: [{
        primaryIdentifier: '',
        secondaryIdentifier: '',
        nameIdentifierType: undefined
      }]
    },
    customerIdentification: '',
    accountNumber: ''
  },
  contact: {
    complianceEmail: '',
    supportReference: ''
  }
});

const createdAtDatetimeLocal = computed({
  get: () => {
    if (!formData.value.createdAt) return '';
    try {
      const date = new Date(formData.value.createdAt);
      if (isNaN(date.getTime())) return '';
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch {
      return '';
    }
  },
  set: (value: string) => {
    if (!value) {
      formData.value.createdAt = getCurrentISOTimestamp();
      return;
    }
    try {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        formData.value.createdAt = date.toISOString();
      }
    } catch {
      formData.value.createdAt = getCurrentISOTimestamp();
    }
  }
});

const handleFileUpload = (event: Event) => {
  if (!sdk.value) {
    result.value = {
      type: 'error',
      message: 'Please initialize the SDK first',
    };
    return;
  }

  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) {
        fileJsonData.value = null;
        fileName.value = '';
        accessToken.value = null;
        accessTokenResult.value = null;
        tokenExpiresAt.value = null;
    return;
  }

  fileName.value = file.name;

  const reader = new FileReader();
  reader.onload = (e) => {
    if (e.target?.result) {
      try {
        const jsonText = e.target.result as string;
        const parsed = JSON.parse(jsonText);
        
        const validatedKeys = sdk.value!.validateVaspKeys(parsed);
        
        fileJsonData.value = validatedKeys;
        sdk.value!.setVaspKeys(validatedKeys);
        accessToken.value = null;
        accessTokenResult.value = null;
        tokenExpiresAt.value = null;
        result.value = {
          type: 'success',
          message: 'JSON file loaded and validated successfully',
        };
      } catch (error) {
        console.error('Error parsing or validating JSON:', error);
        result.value = {
          type: 'error',
          message: error instanceof Error ? error.message : 'Invalid JSON file or validation failed',
        };
        fileJsonData.value = null;
        fileName.value = '';
        accessToken.value = null;
        accessTokenResult.value = null;
        tokenExpiresAt.value = null;
      }
    }
  };
  reader.readAsText(file);
};

const getMessage = async () => {
  if (!sdk.value) {
    result.value = {
      type: 'error',
      message: 'Please initialize the SDK first',
    };
    return;
  }

  if(!fileJsonData.value) {
    result.value = {
      type: 'error',
      message: 'Please upload a certificate file',
    };
    return;
  }
  
  if(!messageId.value) {
    result.value = {
      type: 'error',
      message: 'Please enter a message ID',
    };
    return;
  }
  
  try {
    loading.value = true;
    const message = await sdk.value.getMessageWithAuth(fileJsonData.value, messageId.value);
    
    if (sdk.value.getVaspKeys()) {
      const token = await sdk.value.getAccessToken();
      accessToken.value = token;
      if (token && token.expires_in) {
        const expiresInSeconds = typeof token.expires_in === 'number' ? token.expires_in : parseInt(token.expires_in);
        tokenExpiresAt.value = Date.now() + (expiresInSeconds * 1000);
        currentTime.value = Date.now();
      }
    }
    result.value = {
      type: 'success',
      message: 'Message retrieved successfully',
      data: message,
    };
  } catch (error) {
    console.error('Error getting message:', error);
    result.value = {
      type: 'error',
      message: error instanceof Error ? error.message : 'Failed to get message',
    };
  } finally {
    loading.value = false;
  }
};

const convertEmptyStringsToUndefined = (obj: any): any => {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (typeof obj === 'string') {
    return obj === '' ? undefined : obj;
  }
  
  if (Array.isArray(obj)) {
    const processed = obj.map(item => convertEmptyStringsToUndefined(item));
    
    const filtered = processed.filter(item => item !== undefined);
    return filtered.length === 0 ? undefined : filtered;
  }
  
  if (typeof obj === 'object' && !(obj instanceof File) && !(obj instanceof Blob)) {
    const result: any = {};
    let hasAnyValue = false;
    
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const value = convertEmptyStringsToUndefined(obj[key]);
        if (value !== undefined) {
          result[key] = value;
          hasAnyValue = true;
        }
      }
    }
    
    if (!hasAnyValue) {
      return undefined;
    }
    return result;
  }
  
  return obj;
};

const sendData = async () => {
  if (!sdk.value) {
    result.value = {
      type: 'error',
      message: 'Please initialize the SDK first',
    };
    return;
  }

  if(!fileJsonData.value) {
    result.value = {
      type: 'error',
      message: 'Please upload a certificate file',
    };
    return;
  }
  
  try {
    loading.value = true;
    const cleanedData = convertEmptyStringsToUndefined(formData.value);
    const message = await sdk.value.sendMessageWithAuth(fileJsonData.value, cleanedData as any);
    
    if (sdk.value.getVaspKeys()) {
      const token = await sdk.value.getAccessToken();
      accessToken.value = token;
      if (token && token.expires_in) {
        const expiresInSeconds = typeof token.expires_in === 'number' ? token.expires_in : parseInt(token.expires_in);
        tokenExpiresAt.value = Date.now() + (expiresInSeconds * 1000);
        currentTime.value = Date.now();
      }
    }
    result.value = {
      type: 'success',
      message: 'Message sent successfully',
      data: message,
    };
  } catch (error) {
    console.error('Error sending message:', error);
    result.value = {
      type: 'error',
      message: error instanceof Error ? error.message : 'Failed to send message',
    };
  } finally {
    loading.value = false;
  }
};

const initializeOrUpdateEndpoint = () => {
  if (!endpoint.value.trim()) {
    result.value = {
      type: 'error',
      message: 'Please enter an endpoint URL',
    };
    return;
  }
  
  try {
    if (!sdk.value) {
      sdk.value = new TravelSDKClient({ 
        endpoint: endpoint.value,
        debug: true,
      });
      result.value = {
        type: 'success',
        message: `SDK initialized successfully with endpoint: ${sdk.value.getEndpoint()}`,
      };
    } else {
      const updatedEndpoint = sdk.value.updateEndpoint(endpoint.value);
      result.value = {
        type: 'success',
        message: `Endpoint updated successfully to: ${updatedEndpoint}`,
      };
    }
  } catch (error) {
    result.value = {
      type: 'error',
      message: error instanceof Error ? error.message : 'Failed to initialize or update SDK',
    };
  }
};

const getAccessToken = async () => {
  if (!sdk.value) {
    accessTokenResult.value = {
      type: 'error',
      message: 'Please initialize the SDK first',
    };
    return;
  }

  if(!fileJsonData.value) {
    accessTokenResult.value = {
      type: 'error',
      message: 'Please upload a certificate file',
    };
    return;
  }
  
  try {
    loading.value = true;

    const token = await sdk.value.authenticate(fileJsonData.value);
    accessToken.value = token;

    if (token && token.expires_in) {
      const expiresInSeconds = typeof token.expires_in === 'number' ? token.expires_in : parseInt(token.expires_in);
      tokenExpiresAt.value = Date.now() + (expiresInSeconds * 1000);
      currentTime.value = Date.now();
    } else {
      tokenExpiresAt.value = null;
    }

    accessTokenResult.value = {
      type: 'success',
      message: 'Access token retrieved successfully',
      data: token,
    };
  } catch (error) {
    console.error('Error getting access token:', error);
    accessToken.value = null;
    tokenExpiresAt.value = null;
    accessTokenResult.value = {
      type: 'error',
      message: error instanceof Error ? error.message : 'Failed to get access token',
    };
  } finally {
    loading.value = false;
  }
};

const countdownDisplay = computed(() => {
  if (!tokenExpiresAt.value) return null;
  
  const remaining = Math.max(0, tokenExpiresAt.value - currentTime.value);
  
  if (remaining === 0) return 'Expired';
  
  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
});

onMounted(() => {
  countdownInterval.value = setInterval(() => {
    currentTime.value = Date.now();
  }, 1000);
});

onUnmounted(() => {
  if (countdownInterval.value) {
    clearInterval(countdownInterval.value);
  }
});

</script>

<style scoped>
.container {
  max-width: 1000px;
  margin: 0 auto;
  background: white;
  border-radius: 12px;
  padding: 40px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

h1 {
  color: #333;
  margin-bottom: 30px;
  text-align: center;
}

.form-section {
  margin-bottom: 25px;
}

label {
  display: block;
  margin-bottom: 8px;
  color: #555;
  font-weight: 500;
}

.required {
  color: #e74c3c;
  font-weight: bold;
  margin-left: 2px;
}

input[type="text"],
input[type="email"],
input[type="date"],
input[type="datetime-local"],
input[type="file"],
select {
  width: 100%;
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.3s;
  box-sizing: border-box;
}

input[type="text"]:focus,
input[type="email"]:focus,
input[type="date"]:focus,
input[type="datetime-local"]:focus,
select:focus {
  outline: none;
  border-color: rgb(195 253 205/var(--tw-text-opacity,1));
}

select {
  background-color: white;
  cursor: pointer;
}

.file-info {
  margin-top: 8px;
  padding: 8px;
  background: #f5f5f5;
  border-radius: 6px;
  font-size: 12px;
  color: #666;
}

.send-button {
  width: 100%;
  padding: 14px;
  background: rgb(195 253 205 / var(--tw-bg-opacity, 1)) !important;
  color: rgb(1 85 58 / var(--tw-text-opacity, 1)) !important;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.send-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.send-button:active:not(:disabled) {
  transform: translateY(0);
}

.send-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.update-endpoint-button {
  margin-top: 10px;
  padding: 10px 20px;
  background: rgb(195 253 205 / var(--tw-bg-opacity, 1)) !important;
  color: rgb(1 85 58 / var(--tw-text-opacity, 1)) !important;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  width: 100%;
}

.update-endpoint-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.update-endpoint-button:active {
  transform: translateY(0);
}

.result {
  margin-top: 30px;
  padding: 20px;
  border-radius: 8px;
}

.result.success {
  background: #d4edda;
  border: 1px solid #c3e6cb;
  color: #155724;
}

.result.error {
  background: #f8d7da;
  border: 1px solid #f5c6cb;
  color: #721c24;
}

.result pre {
  margin-top: 10px;
  padding: 12px;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 4px;
  overflow-x: auto;
  font-size: 12px;
  line-height: 1.5;
}

.tabs {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  margin-bottom: 25px;
  border-bottom: 2px solid #e0e0e0;
  padding-bottom: 10px;
}

.tabs-left {
  display: flex;
  gap: 10px;
}

.token-countdown {
  color: #666;
  font-size: 14px;
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 6px;
  white-space: nowrap;
}

.token-countdown strong {
  color: rgb(1 85 58 / var(--tw-text-opacity, 1));
  font-weight: 600;
}

.tab-button {
  padding: 12px 24px;
  background: transparent;
  border: none;
  border-bottom: 3px solid transparent;
  color: #666;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  margin-bottom: -2px;
}

.tab-button:hover {
  color: rgb(1 85 58 / var(--tw-text-opacity, 1)) !important;
}

.tab-button.active {
  color: rgb(1 85 58 / var(--tw-text-opacity, 1)) !important;
  border-bottom-color: rgb(195 253 205/var(--tw-text-opacity,1));
}

.shared-section {
  margin-bottom: 30px;
}

.tab-content {
  margin-bottom: 25px;
}

.form-group {
  margin-bottom: 40px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}

.form-group-title {
  color: #333;
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 2px solid rgb(195 253 205/var(--tw-text-opacity,1));
}

.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin-bottom: 0;
}

.form-row .form-section {
  margin-bottom: 0;
}
</style>
