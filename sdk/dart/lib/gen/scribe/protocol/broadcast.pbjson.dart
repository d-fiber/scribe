// This is a generated file - do not edit.
//
// Generated from scribe/protocol/broadcast.proto.

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

@$core.Deprecated('Use eventScopeDescriptor instead')
const EventScope$json = {
  '1': 'EventScope',
  '2': [
    {'1': 'EVENT_SCOPE_UNSPECIFIED', '2': 0},
    {'1': 'EVENT_SCOPE_ADMIN', '2': 1},
    {'1': 'EVENT_SCOPE_USER', '2': 2},
    {'1': 'EVENT_SCOPE_ADMINS', '2': 3},
    {'1': 'EVENT_SCOPE_USERS', '2': 4},
  ],
};

/// Descriptor for `EventScope`. Decode as a `google.protobuf.EnumDescriptorProto`.
final $typed_data.Uint8List eventScopeDescriptor = $convert.base64Decode(
    'CgpFdmVudFNjb3BlEhsKF0VWRU5UX1NDT1BFX1VOU1BFQ0lGSUVEEAASFQoRRVZFTlRfU0NPUE'
    'VfQURNSU4QARIUChBFVkVOVF9TQ09QRV9VU0VSEAISFgoSRVZFTlRfU0NPUEVfQURNSU5TEAMS'
    'FQoRRVZFTlRfU0NPUEVfVVNFUlMQBA==');
