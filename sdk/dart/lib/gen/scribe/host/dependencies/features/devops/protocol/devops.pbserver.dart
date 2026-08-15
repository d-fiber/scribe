// This is a generated file - do not edit.
//
// Generated from scribe/host/dependencies/features/devops/protocol/devops.proto.

// @dart = 3.3

// ignore_for_file: annotate_overrides, camel_case_types, comment_references
// ignore_for_file: constant_identifier_names
// ignore_for_file: curly_braces_in_flow_control_structures
// ignore_for_file: deprecated_member_use_from_same_package, library_prefixes
// ignore_for_file: non_constant_identifier_names, prefer_relative_imports

import 'dart:async' as $async;
import 'dart:core' as $core;

import 'package:protobuf/protobuf.dart' as $pb;

import 'devops.pb.dart' as $1;
import 'devops.pbjson.dart';

export 'devops.pb.dart';

abstract class DynamicLinksServiceBase extends $pb.GeneratedService {
  $async.Future<$1.LinkResult> add(
      $pb.ServerContext ctx, $1.AddLinkRequest request);
  $async.Future<$1.LinkResult> update(
      $pb.ServerContext ctx, $1.UpdateLinkRequest request);
  $async.Future<$1.LinkResult> remove(
      $pb.ServerContext ctx, $1.RemoveLinkRequest request);

  $pb.GeneratedMessage createRequest($core.String methodName) {
    switch (methodName) {
      case 'Add':
        return $1.AddLinkRequest();
      case 'Update':
        return $1.UpdateLinkRequest();
      case 'Remove':
        return $1.RemoveLinkRequest();
      default:
        throw $core.ArgumentError('Unknown method: $methodName');
    }
  }

  $async.Future<$pb.GeneratedMessage> handleCall($pb.ServerContext ctx,
      $core.String methodName, $pb.GeneratedMessage request) {
    switch (methodName) {
      case 'Add':
        return add(ctx, request as $1.AddLinkRequest);
      case 'Update':
        return update(ctx, request as $1.UpdateLinkRequest);
      case 'Remove':
        return remove(ctx, request as $1.RemoveLinkRequest);
      default:
        throw $core.ArgumentError('Unknown method: $methodName');
    }
  }

  $core.Map<$core.String, $core.dynamic> get $json =>
      DynamicLinksServiceBase$json;
  $core.Map<$core.String, $core.Map<$core.String, $core.dynamic>>
      get $messageJson => DynamicLinksServiceBase$messageJson;
}

abstract class RemoteConfigsServiceBase extends $pb.GeneratedService {
  $async.Future<$1.RemoteConfigResult> get(
      $pb.ServerContext ctx, $1.RemoteConfigRequest request);

  $pb.GeneratedMessage createRequest($core.String methodName) {
    switch (methodName) {
      case 'Get':
        return $1.RemoteConfigRequest();
      default:
        throw $core.ArgumentError('Unknown method: $methodName');
    }
  }

  $async.Future<$pb.GeneratedMessage> handleCall($pb.ServerContext ctx,
      $core.String methodName, $pb.GeneratedMessage request) {
    switch (methodName) {
      case 'Get':
        return get(ctx, request as $1.RemoteConfigRequest);
      default:
        throw $core.ArgumentError('Unknown method: $methodName');
    }
  }

  $core.Map<$core.String, $core.dynamic> get $json =>
      RemoteConfigsServiceBase$json;
  $core.Map<$core.String, $core.Map<$core.String, $core.dynamic>>
      get $messageJson => RemoteConfigsServiceBase$messageJson;
}
