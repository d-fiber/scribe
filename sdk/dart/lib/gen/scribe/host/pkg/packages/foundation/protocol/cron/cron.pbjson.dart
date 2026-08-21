// This is a generated file - do not edit.
//
// Generated from scribe/host/pkg/packages/foundation/protocol/cron/cron.proto.

// @dart = 3.3

// ignore_for_file: annotate_overrides, camel_case_types, comment_references
// ignore_for_file: constant_identifier_names
// ignore_for_file: curly_braces_in_flow_control_structures
// ignore_for_file: deprecated_member_use_from_same_package, library_prefixes
// ignore_for_file: non_constant_identifier_names, prefer_relative_imports
// ignore_for_file: unused_import

import 'dart:convert' as $convert;
import 'dart:core' as $core;
import 'dart:typed_data' as $typed_data;

import '../../../../../../protocol/common.pbjson.dart' as $0;

@$core.Deprecated('Use cronTriggerDescriptor instead')
const CronTrigger$json = {
  '1': 'CronTrigger',
  '2': [
    {'1': 'cron_id', '3': 1, '4': 1, '5': 9, '10': 'cronId'},
    {'1': 'trace_id', '3': 2, '4': 1, '5': 9, '10': 'traceId'},
    {'1': 'scheduled_at', '3': 3, '4': 1, '5': 3, '10': 'scheduledAt'},
    {'1': 'fired_at', '3': 4, '4': 1, '5': 3, '10': 'firedAt'},
    {'1': 'capability_token', '3': 5, '4': 1, '5': 9, '10': 'capabilityToken'},
  ],
};

/// Descriptor for `CronTrigger`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List cronTriggerDescriptor = $convert.base64Decode(
    'CgtDcm9uVHJpZ2dlchIXCgdjcm9uX2lkGAEgASgJUgZjcm9uSWQSGQoIdHJhY2VfaWQYAiABKA'
    'lSB3RyYWNlSWQSIQoMc2NoZWR1bGVkX2F0GAMgASgDUgtzY2hlZHVsZWRBdBIZCghmaXJlZF9h'
    'dBgEIAEoA1IHZmlyZWRBdBIpChBjYXBhYmlsaXR5X3Rva2VuGAUgASgJUg9jYXBhYmlsaXR5VG'
    '9rZW4=');

@$core.Deprecated('Use cronOutcomeDescriptor instead')
const CronOutcome$json = {
  '1': 'CronOutcome',
  '2': [
    {'1': 'completed', '3': 1, '4': 1, '5': 8, '10': 'completed'},
    {
      '1': 'error',
      '3': 2,
      '4': 1,
      '5': 11,
      '6': '.scribe.v1.Failure',
      '10': 'error'
    },
  ],
};

/// Descriptor for `CronOutcome`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List cronOutcomeDescriptor = $convert.base64Decode(
    'CgtDcm9uT3V0Y29tZRIcCgljb21wbGV0ZWQYASABKAhSCWNvbXBsZXRlZBIoCgVlcnJvchgCIA'
    'EoCzISLnNjcmliZS52MS5GYWlsdXJlUgVlcnJvcg==');

const $core.Map<$core.String, $core.dynamic> CronDispatchServiceBase$json = {
  '1': 'CronDispatch',
  '2': [
    {
      '1': 'Trigger',
      '2': '.scribe.runtime.cron.v1.CronTrigger',
      '3': '.scribe.runtime.cron.v1.CronOutcome'
    },
  ],
};

@$core.Deprecated('Use cronDispatchServiceDescriptor instead')
const $core.Map<$core.String, $core.Map<$core.String, $core.dynamic>>
    CronDispatchServiceBase$messageJson = {
  '.scribe.runtime.cron.v1.CronTrigger': CronTrigger$json,
  '.scribe.runtime.cron.v1.CronOutcome': CronOutcome$json,
  '.scribe.v1.Failure': $0.Failure$json,
};

/// Descriptor for `CronDispatch`. Decode as a `google.protobuf.ServiceDescriptorProto`.
final $typed_data.Uint8List cronDispatchServiceDescriptor = $convert.base64Decode(
    'CgxDcm9uRGlzcGF0Y2gSUwoHVHJpZ2dlchIjLnNjcmliZS5ydW50aW1lLmNyb24udjEuQ3Jvbl'
    'RyaWdnZXIaIy5zY3JpYmUucnVudGltZS5jcm9uLnYxLkNyb25PdXRjb21l');
