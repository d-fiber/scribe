// This is a generated file - do not edit.
//
// Generated from scribe/host/packages/foundation/event_driven/queue/protocol/queue.proto.

// @dart = 3.3

// ignore_for_file: annotate_overrides, camel_case_types, comment_references
// ignore_for_file: constant_identifier_names
// ignore_for_file: curly_braces_in_flow_control_structures
// ignore_for_file: deprecated_member_use_from_same_package, library_prefixes
// ignore_for_file: non_constant_identifier_names, prefer_relative_imports

import 'dart:async' as $async;
import 'dart:core' as $core;

import 'package:protobuf/protobuf.dart' as $pb;

import 'queue.pb.dart' as $1;
import 'queue.pbjson.dart';

export 'queue.pb.dart';

abstract class QueueServiceBase extends $pb.GeneratedService {
  $async.Future<$1.PushResult> push(
      $pb.ServerContext ctx, $1.PushRequest request);

  $pb.GeneratedMessage createRequest($core.String methodName) {
    switch (methodName) {
      case 'Push':
        return $1.PushRequest();
      default:
        throw $core.ArgumentError('Unknown method: $methodName');
    }
  }

  $async.Future<$pb.GeneratedMessage> handleCall($pb.ServerContext ctx,
      $core.String methodName, $pb.GeneratedMessage request) {
    switch (methodName) {
      case 'Push':
        return push(ctx, request as $1.PushRequest);
      default:
        throw $core.ArgumentError('Unknown method: $methodName');
    }
  }

  $core.Map<$core.String, $core.dynamic> get $json => QueueServiceBase$json;
  $core.Map<$core.String, $core.Map<$core.String, $core.dynamic>>
      get $messageJson => QueueServiceBase$messageJson;
}

abstract class QueueDispatchServiceBase extends $pb.GeneratedService {
  $async.Future<$1.BatchOutcome> handle(
      $pb.ServerContext ctx, $1.Batch request);

  $pb.GeneratedMessage createRequest($core.String methodName) {
    switch (methodName) {
      case 'Handle':
        return $1.Batch();
      default:
        throw $core.ArgumentError('Unknown method: $methodName');
    }
  }

  $async.Future<$pb.GeneratedMessage> handleCall($pb.ServerContext ctx,
      $core.String methodName, $pb.GeneratedMessage request) {
    switch (methodName) {
      case 'Handle':
        return handle(ctx, request as $1.Batch);
      default:
        throw $core.ArgumentError('Unknown method: $methodName');
    }
  }

  $core.Map<$core.String, $core.dynamic> get $json =>
      QueueDispatchServiceBase$json;
  $core.Map<$core.String, $core.Map<$core.String, $core.dynamic>>
      get $messageJson => QueueDispatchServiceBase$messageJson;
}
