// This is a generated file - do not edit.
//
// Generated from scribe/host/packages/realtime/protocol/realtime.proto.

// @dart = 3.3

// ignore_for_file: annotate_overrides, camel_case_types, comment_references
// ignore_for_file: constant_identifier_names
// ignore_for_file: curly_braces_in_flow_control_structures
// ignore_for_file: deprecated_member_use_from_same_package, library_prefixes
// ignore_for_file: non_constant_identifier_names, prefer_relative_imports

import 'dart:async' as $async;
import 'dart:core' as $core;

import 'package:protobuf/protobuf.dart' as $pb;

import 'realtime.pb.dart' as $1;
import 'realtime.pbjson.dart';

export 'realtime.pb.dart';

abstract class RealtimeServiceBase extends $pb.GeneratedService {
  $async.Future<$1.BroadcastResult> broadcast(
      $pb.ServerContext ctx, $1.BroadcastRequest request);
  $async.Future<$1.GrantResult> grant(
      $pb.ServerContext ctx, $1.GrantRequest request);
  $async.Future<$1.GrantResult> revoke(
      $pb.ServerContext ctx, $1.GrantRequest request);

  $pb.GeneratedMessage createRequest($core.String methodName) {
    switch (methodName) {
      case 'Broadcast':
        return $1.BroadcastRequest();
      case 'Grant':
        return $1.GrantRequest();
      case 'Revoke':
        return $1.GrantRequest();
      default:
        throw $core.ArgumentError('Unknown method: $methodName');
    }
  }

  $async.Future<$pb.GeneratedMessage> handleCall($pb.ServerContext ctx,
      $core.String methodName, $pb.GeneratedMessage request) {
    switch (methodName) {
      case 'Broadcast':
        return broadcast(ctx, request as $1.BroadcastRequest);
      case 'Grant':
        return grant(ctx, request as $1.GrantRequest);
      case 'Revoke':
        return revoke(ctx, request as $1.GrantRequest);
      default:
        throw $core.ArgumentError('Unknown method: $methodName');
    }
  }

  $core.Map<$core.String, $core.dynamic> get $json => RealtimeServiceBase$json;
  $core.Map<$core.String, $core.Map<$core.String, $core.dynamic>>
      get $messageJson => RealtimeServiceBase$messageJson;
}
